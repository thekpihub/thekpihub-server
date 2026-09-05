<?php
// stripe-session.php — Issue a Stripe Embedded Checkout session.
// Designed for Hostinger PHP environment.
// Securely loaded via .env / getenv()

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Read POST payload
$input = json_decode(file_get_contents('php://input'), true);
$priceId = $input['price_id'] ?? '';
$userId  = $input['user_id'] ?? '';
$email   = $input['email'] ?? '';
$plan    = $input['plan'] ?? '';

if (empty($priceId) || empty($userId) || empty($email) || empty($plan)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields: price_id, user_id, email, plan']);
    exit;
}

// Load Stripe API Key from environment
$stripeSecretKey = getenv('STRIPE_SECRET_KEY');

if (!$stripeSecretKey) {
    http_response_code(500);
    echo json_encode(['error' => 'Stripe server configuration error: STRIPE_SECRET_KEY is missing']);
    exit;
}

// Call Stripe REST API to create a Checkout Session
$url = 'https://api.stripe.com/v1/checkout/sessions';
$fields = [
    'ui_mode'               => 'embedded',
    'mode'                  => 'subscription',
    'customer_email'        => $email,
    'line_items[0][price]'  => $priceId,
    'line_items[0][quantity]'=> 1,
    'return_url'            => 'https://thekpihub.com/upgrade-success.html?session_id={CHECKOUT_SESSION_ID}',
    'metadata[user_id]'     => $userId,
    'metadata[plan]'        => $plan
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($fields));
curl_setopt($ch, CURLOPT_USERPWD, $stripeSecretKey . ':');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/x-www-form-urlencoded'
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);

$response = curl_exec($ch);
$httpStatusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false) {
    http_response_code(502);
    echo json_encode(['error' => 'Stripe API network failure: ' . $curlError]);
    exit;
}

$data = json_decode($response, true);

if ($httpStatusCode !== 200) {
    http_response_code($httpStatusCode);
    echo json_encode([
        'error' => $data['error']['message'] ?? 'Stripe Session creation failed',
        'stripe_error' => $data
    ]);
    exit;
}

// Return client secret to mount embedded checkout frame on frontend
echo json_encode([
    'clientSecret' => $data['client_secret'] ?? '',
    'session_id'   => $data['id'] ?? ''
]);
exit;
?>
