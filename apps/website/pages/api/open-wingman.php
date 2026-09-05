<?php
// Supabase auth handoff to Wingman agent dashboard.
//
// DEPRECATED 2026-09-04: dashboard.html's "Open WingCommander" button now
// calls apps/website/open-wingman.php (repo root) directly via fetch+POST
// instead. This file relied on an Authorization header or sb-token cookie
// reaching it via a plain browser navigation, but this site never sets that
// cookie (it was ported from a Next.js design assuming SSR cookie sessions,
// which doesn't match this static/client-side Supabase setup) — so it could
// never actually receive a valid token in practice. Left in place, unused,
// rather than deleted; see servermemory.md (2026-09-04) for the full trace.
//
// Requires these env vars set in .htaccess via SetEnv directives:
//   SetEnv SUPABASE_URL            https://YOUR_PROJECT_ID.supabase.co
//   SetEnv SUPABASE_SERVICE_ROLE_KEY  <service role key from Supabase dashboard>
//   SetEnv WINGMAN_API_URL         https://ditto-wingman-backend-production.up.railway.app
//   SetEnv WINGMAN_URL             https://agent.thekpihub.com
//   SetEnv HANDOFF_SECRET          <shared secret with Wingman backend>

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

$supabaseUrl      = getenv('SUPABASE_URL');
$serviceRoleKey   = getenv('SUPABASE_SERVICE_ROLE_KEY');
$wingmanApiUrl    = getenv('WINGMAN_API_URL');
$wingmanUrl       = getenv('WINGMAN_URL') ?: 'https://agent.thekpihub.com';
$handoffSecret    = getenv('HANDOFF_SECRET');

// Extract Bearer token from Authorization header, fall back to sb-token cookie.
$token = '';
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (str_starts_with($authHeader, 'Bearer ')) {
    $token = substr($authHeader, 7);
} elseif (!empty($_COOKIE['sb-token'])) {
    $token = $_COOKIE['sb-token'];
}

if ($token === '') {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

// Validate token and get user via Supabase Auth REST API.
$userRes = supabase_get($supabaseUrl . '/auth/v1/user', [
    'Authorization' => 'Bearer ' . $token,
    'apikey'        => $serviceRoleKey,
]);

if ($userRes['status'] !== 200 || empty($userRes['body']['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$user = $userRes['body'];
$userId = $user['id'];

// Fetch plan from profiles table using service role key (bypasses RLS).
$profileRes = supabase_get(
    $supabaseUrl . '/rest/v1/profiles?select=plan&id=eq.' . urlencode($userId) . '&limit=1',
    [
        'Authorization' => 'Bearer ' . $serviceRoleKey,
        'apikey'        => $serviceRoleKey,
        'Accept'        => 'application/json',
    ]
);

$rawPlan = 'starter';
if ($profileRes['status'] === 200 && !empty($profileRes['body'][0]['plan'])) {
    $rawPlan = $profileRes['body'][0]['plan'];
}

// Map thekpihub.com plans → WingCommander JWT plan tiers
$planMap = ['growth' => 'pro', 'enterprise' => 'enterprise'];
if (!array_key_exists($rawPlan, $planMap)) {
    header('Location: /pricing?reason=premium_required');
    exit;
}
$plan = $planMap[$rawPlan];

// Issue a short-lived Wingman token.
$tokenRes = supabase_post($wingmanApiUrl . '/api/auth/token', [
    'sub'       => $userId,
    'email'     => $user['email'] ?? '',
    'plan'      => $plan,
    'name'      => $user['user_metadata']['full_name'] ?? '',
    'avatarUrl' => $user['user_metadata']['avatar_url'] ?? '',
    'secret'    => $handoffSecret,
]);

if ($tokenRes['status'] !== 200 || empty($tokenRes['body']['token'])) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to issue token']);
    exit;
}

header('Location: ' . $wingmanUrl . '/dashboard?token=' . urlencode($tokenRes['body']['token']));
exit;

// ---------------------------------------------------------------------------

function supabase_get(string $url, array $headers): array {
    return curl_request('GET', $url, $headers);
}

function supabase_post(string $url, array $payload): array {
    return curl_request('POST', $url, ['Content-Type' => 'application/json'], $payload);
}

function curl_request(string $method, string $url, array $headers, ?array $payload = null): array {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);

    $headerLines = [];
    foreach ($headers as $key => $value) {
        $headerLines[] = $key . ': ' . $value;
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headerLines);

    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    }

    $body   = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        'status' => $status,
        'body'   => json_decode($body, true) ?? [],
    ];
}
exit;
?>
