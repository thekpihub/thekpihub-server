<?php
// pages/api/ai-gateway.php — Plan-Gated Multi-Model AI Proxy
// Designed for Hostinger PHP environment.
// Integrates direct Anthropic and OpenRouter endpoints with Supabase Auth validation.

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// ─── 1. EXTRACT AUTHORIZATION ───────────────────────────────────────────────
$token = '';
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (str_starts_with($authHeader, 'Bearer ')) {
    $token = substr($authHeader, 7);
} elseif (!empty($_COOKIE['sb-token'])) {
    $token = $_COOKIE['sb-token'];
}

if (empty($token)) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated: Missing session token']);
    exit;
}

// ─── 2. LOAD ENVIRONMENT CONFIGS ─────────────────────────────────────────────
$supabaseUrl       = getenv('SUPABASE_URL');
$serviceRoleKey    = getenv('SUPABASE_SERVICE_ROLE_KEY');
// Direct-Anthropic/OpenRouter cURL logic used to live here, duplicated
// against apps/website/pipeline.py's own version -- now both call sites
// route through services/llm_gateway instead. See that module's README.
$gatewayUrl        = getenv('LLM_GATEWAY_URL');
$gatewaySecret     = getenv('GATEWAY_SHARED_SECRET');

if (!$supabaseUrl || !$serviceRoleKey) {
    http_response_code(500);
    echo json_encode(['error' => 'Server configuration error: Supabase configurations missing']);
    exit;
}

// ─── 3. VERIFY SUPABASE SESSION & GET USER ID ───────────────────────────────
$verifyUrl = rtrim($supabaseUrl, '/') . '/auth/v1/user';
$ch = curl_init($verifyUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'apikey: ' . $serviceRoleKey
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$userRes = curl_exec($ch);
$httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpStatus !== 200) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication failed or session expired']);
    exit;
}

$userData = json_decode($userRes, true);
$userId   = $userData['id'] ?? '';

if (empty($userId)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid user metadata returned from auth service']);
    exit;
}

// ─── 4. FETCH USER PROFILE & PLAN ────────────────────────────────────────────
$profileUrl = rtrim($supabaseUrl, '/') . '/rest/v1/profiles?select=plan&id=eq.' . urlencode($userId) . '&limit=1';
$ch = curl_init($profileUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $serviceRoleKey,
    'apikey: ' . $serviceRoleKey,
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$profileRes = curl_exec($ch);
$httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$plan = 'starter'; // Default to free/starter plan
if ($httpStatus === 200) {
    $profileData = json_decode($profileRes, true);
    if (!empty($profileData[0]['plan'])) {
        $plan = strtolower($profileData[0]['plan']);
    }
}

// ─── 5. READ PAYLOAD & VALIDATE MODEL SELECTION ─────────────────────────────
$input = json_decode(file_get_contents('php://input'), true);
$prompt = $input['prompt'] ?? '';
$system = $input['system'] ?? 'You are an expert SaaS metrics analyst for The KPI Hub.';
$model  = $input['model'] ?? 'google/gemini-2.0-flash-lite:free'; // Default free model

if (empty($prompt)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing prompt parameter']);
    exit;
}

// ─── 5b. MODEL SOMMELIER™ — auto-select best model for task type ─────────────
// If caller passes model='auto', pick the optimal model based on task signals.
if ($model === 'auto') {
    $lower = strtolower($prompt);
    if (preg_match('/translat|hindi|tamil|spanish|french|german|arabic|mandarin/i', $lower)) {
        $model = 'google/gemini-2.0-flash';          // best multilingual
    } elseif (preg_match('/image|chart|graph|screenshot|visual|photo/i', $lower)) {
        $model = 'google/gemini-2.0-flash';          // best multimodal
    } elseif (preg_match('/code|python|javascript|sql|function|script|debug/i', $lower)) {
        $model = ($plan === 'enterprise') ? 'claude-opus-4-7' : 'claude-sonnet-4-6';
    } elseif (preg_match('/analyz|revenue|forecast|trend|anomaly|predict|quarter|metrics/i', $lower)) {
        $model = ($plan === 'enterprise') ? 'claude-opus-4-7' : 'claude-sonnet-4-6';
    } elseif (preg_match('/quick|brief|summary|short|tldr|what is/i', $lower)) {
        $model = 'meta-llama/llama-3.3-70b-instruct';  // fastest/cheapest
    } else {
        $model = 'claude-sonnet-4-6';               // balanced default
    }
}

// Model access tiers — matches WingCommander backend/src/middleware/auth.ts
$modelAccess = [
    'starter'    => ['google/gemini-2.0-flash-lite:free', 'meta-llama/llama-3.1-8b-instruct:free'],
    'growth'     => [
        'claude-sonnet-4-6', 'claude-haiku-4-5-20251001',
        'mistral/mistral-large-latest', 'meta-llama/llama-3.3-70b-instruct',
        'google/gemini-2.0-flash', 'openai/gpt-4o-mini',
    ],
    'enterprise' => [
        'claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-opus-4-7',
        'mistral/mistral-large-latest', 'meta-llama/llama-3.3-70b-instruct',
        'google/gemini-2.0-flash', 'google/gemini-2.0-pro', 'openai/gpt-4o',
        'x-ai/grok-2', 'deepseek/deepseek-chat', 'deepseek/deepseek-r1',
        'openai/o3-mini',
    ],
];

// Which models get a direct-Anthropic attempt (with automatic OpenRouter
// fallback) vs. going straight to OpenRouter is now the gateway service's
// own decision (services/llm_gateway/server.py's DIRECT_ANTHROPIC_MODELS +
// OPENROUTER_SLUG) -- this file used to duplicate that table and the actual
// cURL-to-Anthropic/cURL-to-OpenRouter implementation here. 2026-09-08.

function call_llm_gateway($gatewayUrl, $gatewaySecret, $model, $system, $prompt, $maxTokens) {
    $ch = curl_init(rtrim($gatewayUrl, '/') . '/v1/chat');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'model'      => $model,
        'system'     => $system,
        'prompt'     => $prompt,
        'max_tokens' => $maxTokens,
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'X-Gateway-Secret: ' . $gatewaySecret,
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    $response = curl_exec($ch);
    $httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['status' => $httpStatus, 'body' => $response];
}

$allowedModels = $modelAccess[$plan] ?? $modelAccess['starter'];
if (!in_array($model, $allowedModels, true)) {
    http_response_code(402);
    echo json_encode([
        'error'          => 'upgrade_required',
        'message'        => 'The model "' . $model . '" requires a higher plan.',
        'allowed_models' => $allowedModels,
        'upgrade_url'    => 'https://thekpihub.com/upgrade.html',
    ]);
    exit;
}

// ─── 6. ROUTE AND CALL THE CHOSEN AI ENDPOINT (via services/llm_gateway) ────
// Both direct-Anthropic (with automatic OpenRouter fallback) and pure-
// OpenRouter models now go through one shared gateway service instead of
// this file duplicating cURL-to-Anthropic + cURL-to-OpenRouter logic
// directly (previously ~100 lines here, kept in sync by hand with the same
// logic in apps/website/pipeline.py -- now both call one implementation).
// See services/llm_gateway/README.md. 2026-09-08.
if (!$gatewayUrl || !$gatewaySecret) {
    http_response_code(500);
    echo json_encode(['error' => 'LLM gateway is not configured on the server']);
    exit;
}

$result = call_llm_gateway($gatewayUrl, $gatewaySecret, $model, $system, $prompt, 2048);
$data = json_decode($result['body'], true);

if ($result['status'] !== 200) {
    http_response_code($result['status'] ?: 502);
    echo json_encode(['error' => 'LLM gateway error', 'details' => $data]);
    exit;
}

echo json_encode(['text' => $data['text'] ?? '', 'model' => $model, 'via' => $data['via'] ?? 'unknown']);
exit;
?>
