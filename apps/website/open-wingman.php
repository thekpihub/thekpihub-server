<?php
/**
 * open-wingman.php — WingCommander JWT launch endpoint
 *
 * Flow:
 *   1. Frontend sends POST with Supabase session JWT
 *   2. We verify Supabase JWT with service role key
 *   3. We look up user's plan in profiles table
 *   4. If growth or enterprise → call WingCommander /api/auth/token → return JWT
 *   5. If starter → return 403 with upgrade URL
 *
 * Called by: dashboard.html "Open WingCommander" button (fetch + POST,
 * navigates to the returned redirectUrl on success).
 *
 * Corrected 2026-09-04: originally required an X-HMAC-Signature header too
 * ("proves request is from our own frontend, not a bot"), but that can only
 * be verified against HMAC_SECRET, a server-only secret this file's own
 * caller — plain browser JS — has no way to compute. That made this endpoint
 * uncallable from the actual site (apps/website is a static/client-side
 * Supabase app, not a server with access to that secret), which is why
 * dashboard.html's button never actually called this file before now. Real
 * auth here doesn't depend on the HMAC anyway: a request still needs a
 * genuine, service-role-verified Supabase JWT, and the resulting plan is
 * looked up server-side, never client-supplied — matching the security model
 * apps/website/pages/api/open-wingman.php (the sibling implementation) already
 * used with no HMAC step at all. See servermemory.md for the full trace.
 *
 * Returns:   { token, redirectUrl } or { error, upgradeUrl }
 */

require_once('/home/u117990013/private/kpihub_config.php');

header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$body         = file_get_contents('php://input');
$data         = json_decode($body, true);
$supabaseJwt  = $data['supabase_token'] ?? '';

if (empty($supabaseJwt)) {
    http_response_code(400);
    echo json_encode(['error' => 'supabase_token is required']);
    exit;
}

// ── Step 2: Verify Supabase JWT + fetch user profile ─────────────────────────
$supabaseUrl     = getenv('SUPABASE_URL');
$serviceRoleKey  = getenv('SUPABASE_SERVICE_ROLE_KEY');
$wingUrl         = getenv('WINGCOMMANDER_API_URL');  // e.g. https://api.wingcommander.thekpihub.com
$wingSecret      = getenv('WINGCOMMANDER_HANDOFF_SECRET');

if (!$supabaseUrl || !$serviceRoleKey || !$wingUrl || !$wingSecret) {
    http_response_code(500);
    echo json_encode(['error' => 'Server configuration incomplete']);
    exit;
}

// Verify token and get user from Supabase
$userCh = curl_init();
curl_setopt($userCh, CURLOPT_URL, rtrim($supabaseUrl, '/') . '/auth/v1/user');
curl_setopt($userCh, CURLOPT_RETURNTRANSFER, true);
curl_setopt($userCh, CURLOPT_HTTPHEADER, [
    'apikey: '        . $serviceRoleKey,
    'Authorization: Bearer ' . $supabaseJwt,
]);
curl_setopt($userCh, CURLOPT_TIMEOUT, 10);
$userResp = curl_exec($userCh);
$userCode = curl_getinfo($userCh, CURLINFO_HTTP_CODE);
curl_close($userCh);

if ($userCode !== 200) {
    http_response_code(401);
    echo json_encode(['error' => 'Supabase session invalid or expired']);
    exit;
}

$user   = json_decode($userResp, true);
$userId = $user['id']    ?? '';
$email  = $user['email'] ?? '';
$name   = $user['user_metadata']['name'] ?? $user['user_metadata']['full_name'] ?? '';

if (empty($userId)) {
    http_response_code(401);
    echo json_encode(['error' => 'Could not resolve user identity']);
    exit;
}

// ── Step 3: Fetch user plan from profiles table ───────────────────────────────
$profileCh = curl_init();
curl_setopt($profileCh, CURLOPT_URL, rtrim($supabaseUrl, '/') . '/rest/v1/profiles?id=eq.' . urlencode($userId) . '&select=plan,first_name,last_name');
curl_setopt($profileCh, CURLOPT_RETURNTRANSFER, true);
curl_setopt($profileCh, CURLOPT_HTTPHEADER, [
    'apikey: '        . $serviceRoleKey,
    'Authorization: Bearer ' . $serviceRoleKey,
    'Accept: application/json',
]);
curl_setopt($profileCh, CURLOPT_TIMEOUT, 10);
$profileResp = curl_exec($profileCh);
$profileCode = curl_getinfo($profileCh, CURLINFO_HTTP_CODE);
curl_close($profileCh);

if ($profileCode !== 200) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not fetch user profile']);
    exit;
}

$profiles = json_decode($profileResp, true);
$profile  = $profiles[0] ?? null;
$plan     = $profile['plan'] ?? 'starter';

// Resolve display name
if (empty($name) && $profile) {
    $name = trim(($profile['first_name'] ?? '') . ' ' . ($profile['last_name'] ?? ''));
}

// ── Step 4: Plan gate ─────────────────────────────────────────────────────────
// Map thekpihub plans → WingCommander plan tiers
$planMap = [
    'starter'    => null,        // no access
    'growth'     => 'pro',       // full WingCommander access
    'enterprise' => 'enterprise' // full access + priority models
];

$wingPlan = $planMap[$plan] ?? null;

if ($wingPlan === null) {
    http_response_code(403);
    echo json_encode([
        'error'      => 'WingCommander requires the Growth plan or above.',
        'currentPlan' => $plan,
        'upgradeUrl' => 'https://thekpihub.com/upgrade.html',
        'requiredPlan' => 'growth',
    ]);
    exit;
}

// ── Step 5: Mint WingCommander JWT via handoff endpoint ───────────────────────
$payload = json_encode([
    'sub'       => $userId,
    'email'     => $email,
    'plan'      => $wingPlan,
    'name'      => $name ?: null,
    'secret'    => $wingSecret,
]);

$tokenCh = curl_init();
curl_setopt($tokenCh, CURLOPT_URL, rtrim($wingUrl, '/') . '/api/auth/token');
curl_setopt($tokenCh, CURLOPT_RETURNTRANSFER, true);
curl_setopt($tokenCh, CURLOPT_POST, true);
curl_setopt($tokenCh, CURLOPT_POSTFIELDS, $payload);
curl_setopt($tokenCh, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json',
]);
curl_setopt($tokenCh, CURLOPT_TIMEOUT, 15);
$tokenResp = curl_exec($tokenCh);
$tokenCode = curl_getinfo($tokenCh, CURLINFO_HTTP_CODE);
curl_close($tokenCh);

if ($tokenCode !== 200) {
    http_response_code(502);
    echo json_encode(['error' => 'WingCommander service temporarily unavailable. Please try again.']);
    exit;
}

$tokenData = json_decode($tokenResp, true);
$jwt       = $tokenData['token'] ?? '';

if (empty($jwt)) {
    http_response_code(502);
    echo json_encode(['error' => 'Failed to obtain WingCommander access token']);
    exit;
}

// ── Step 6: Return redirect URL with token ────────────────────────────────────
$wingFrontend = getenv('WINGCOMMANDER_URL') ?: 'https://wingcommander.thekpihub.com';

echo json_encode([
    'token'       => $jwt,
    'redirectUrl' => $wingFrontend . '?token=' . urlencode($jwt),
    'plan'        => $wingPlan,
    'expiresIn'   => 3600,
]);
exit;
?>
