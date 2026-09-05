<?php
/**
 * brevo-subscribe.php — adds a website lead to a Brevo contact list so the
 * existing email automation (5-email nurture sequence) fires for them.
 *
 * SECURITY: reads BREVO_API_KEY + BREVO_LIST_ID from the environment only
 * (set via .htaccess SetEnv on Hostinger). NEVER hardcode the key here, and
 * never commit real values. Matches the project rule: no secrets in client code.
 *
 * Called (fire-and-forget) by the get-audit.html intake form ALONGSIDE its
 * existing Formspree submit — so a failure here must stay silent and must not
 * affect the lead's primary submission.
 */

header('Content-Type: application/json');

// Only accept POST.
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'method not allowed']);
    exit;
}

$data  = json_decode(file_get_contents('php://input'), true) ?: [];
$email = filter_var($data['email'] ?? '', FILTER_VALIDATE_EMAIL);
if (!$email) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid email']);
    exit;
}

$apiKey = getenv('BREVO_API_KEY');
$listId = getenv('BREVO_LIST_ID');
if (!$apiKey || !$listId) {
    // Misconfigured server — fail closed but quietly (502), never expose details.
    http_response_code(502);
    echo json_encode(['error' => 'not configured']);
    exit;
}

// FIRSTNAME is a Brevo default attribute (safe to send).
// WEBSITE / QUESTION are custom attributes: create them in Brevo
// (Contacts → Settings → Contact attributes) then uncomment below to store them.
$payload = [
    'email'      => $email,
    'attributes' => [
        'FIRSTNAME' => substr(trim($data['firstname'] ?? $data['name'] ?? ''), 0, 100),
        // 'WEBSITE'  => substr(trim($data['website'] ?? ''), 0, 200),
        // 'QUESTION' => substr(trim($data['question'] ?? ''), 0, 500),
    ],
    'listIds'       => [ (int) $listId ],
    'updateEnabled' => true, // don't error if the contact already exists
];

$ch = curl_init('https://api.brevo.com/v3/contacts');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_TIMEOUT        => 8,
    CURLOPT_HTTPHEADER     => [
        'accept: application/json',
        'content-type: application/json',
        'api-key: ' . $apiKey,
    ],
    CURLOPT_POSTFIELDS => json_encode($payload),
]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Brevo returns 201 (created) or 204 (already existed, updated) on success.
http_response_code(($code === 201 || $code === 204) ? 200 : 502);
echo json_encode(['brevo_status' => $code]);
exit;
?>
