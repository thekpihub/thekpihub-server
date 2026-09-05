<?php
// stripe-webhook.php — Handle automated checkout provisioning securely.
// Pure PHP lightweight implementation (no dependencies, using native cURL)
// Specifically built for the Hostinger production hosting environment.

header('Content-Type: application/json');

// Retrieve configurations from environment
$webhookSecret       = getenv('STRIPE_WEBHOOK_SECRET');
$supabaseUrl         = getenv('SUPABASE_URL');
$serviceRoleKey      = getenv('SUPABASE_SERVICE_ROLE_KEY');
$telegramBotToken    = getenv('TELEGRAM_BOT_TOKEN');
$telegramChatId      = getenv('TELEGRAM_CHAT_ID');

if (!$webhookSecret || !$supabaseUrl || !$serviceRoleKey) {
    http_response_code(500);
    echo json_encode(['error' => 'Webhook handler environment is not fully configured']);
    exit;
}

// Read raw request body
$payload = file_get_contents('php://input');
$sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

// Verify Stripe Signature manually to eliminate composer dependencies
if (empty($sigHeader)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing Stripe-Signature header']);
    exit;
}

// Parse signature header (format: t=timestamp,v1=signature)
$timestamp = 0;
$signatures = [];
$parts = explode(',', $sigHeader);
foreach ($parts as $part) {
    $kv = explode('=', $part, 2);
    if (count($kv) === 2) {
        $key = trim($kv[0]);
        $val = trim($kv[1]);
        if ($key === 't') {
            $timestamp = (int)$val;
        } elseif ($key === 'v1') {
            $signatures[] = $val;
        }
    }
}

if ($timestamp === 0 || empty($signatures)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid Stripe-Signature format']);
    exit;
}

// Check timestamp against replay attacks (e.g. max 5 minutes old)
if (time() - $timestamp > 300) {
    http_response_code(400);
    echo json_encode(['error' => 'Stripe-Signature timestamp expired (replay guard)']);
    exit;
}

// Compute expected signature
$signedPayload = $timestamp . '.' . $payload;
$computedSignature = hash_hmac('sha256', $signedPayload, $webhookSecret);

$verified = false;
foreach ($signatures as $signature) {
    if (hash_equals($computedSignature, $signature)) {
        $verified = true;
        break;
    }
}

if (!$verified) {
    http_response_code(401);
    echo json_encode(['error' => 'Stripe-Signature verification failed']);
    exit;
}

// Signature is valid! Parse the event payload
$event = json_decode($payload, true);
$eventType = $event['type'] ?? '';

if ($eventType === 'checkout.session.completed') {
    $session = $event['data']['object'];
    $userId  = $session['metadata']['user_id'] ?? '';
    $plan    = $session['metadata']['plan'] ?? '';
    $email   = $session['customer_email'] ?? '';

    if (empty($userId) || empty($plan)) {
        http_response_code(400);
        echo json_encode(['error' => 'Malformed session metadata: user_id or plan is missing']);
        exit;
    }

    // Call Supabase API to update user profile plan
    $updateUrl = rtrim($supabaseUrl, '/') . '/rest/v1/profiles?id=eq.' . urlencode($userId);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $updateUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['plan' => $plan]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $serviceRoleKey,
        'Authorization: Bearer ' . $serviceRoleKey,
        'Content-Type: application/json',
        'Prefer: resolution=merge-duplicates'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);

    $response = curl_exec($ch);
    $httpStatusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // If Supabase update fails, send alert via Telegram Bot and return 500
    if ($httpStatusCode < 200 || $httpStatusCode >= 300) {
        if ($telegramBotToken && $telegramChatId) {
            $errMessage = "⚠️ *DATABASE UPGRADE FAILURE alert*\n\n" .
                          "• *User ID*: `{$userId}`\n" .
                          "• *Email*: `{$email}`\n" .
                          "• *Attempted Plan*: `{$plan}`\n" .
                          "• *Supabase REST Status*: `{$httpStatusCode}`\n" .
                          "• *Supabase Response*: `{$response}`\n\n" .
                          "_Stripe has been sent a 500 error and will retry soon._";
            
            $teleUrl = "https://api.telegram.org/bot" . $telegramBotToken . "/sendMessage";
            $teleCh = curl_init();
            curl_setopt($teleCh, CURLOPT_URL, $teleUrl);
            curl_setopt($teleCh, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($teleCh, CURLOPT_POST, true);
            curl_setopt($teleCh, CURLOPT_POSTFIELDS, http_build_query([
                'chat_id'    => $telegramChatId,
                'text'       => $errMessage,
                'parse_mode' => 'Markdown'
            ]));
            curl_setopt($teleCh, CURLOPT_TIMEOUT, 10);
            curl_exec($teleCh);
            curl_close($teleCh);
        }

        http_response_code(500);
        echo json_encode(['error' => 'Supabase profile update failed', 'status' => $httpStatusCode]);
        exit;
    }
}

// Return 200 OK to Stripe for all processed events
http_response_code(200);
echo json_encode(['status' => 'success', 'event' => $eventType]);
exit;
?>
