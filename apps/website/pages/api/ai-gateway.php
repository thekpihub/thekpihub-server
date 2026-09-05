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
$anthropicApiKey   = getenv('ANTHROPIC_API_KEY');
$openrouterApiKey  = getenv('OPENROUTER_API_KEY');

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

// Direct-Anthropic models (bypass OpenRouter)
$directAnthropicModels = ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-opus-4-7'];

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

// ─── 6. ROUTE AND CALL THE CHOSEN AI ENDPOINT ────────────────────────────────
if (in_array($model, $directAnthropicModels, true)) {
    // ➔ Call direct Anthropic Messages API
    if (!$anthropicApiKey) {
        http_response_code(500);
        echo json_encode(['error' => 'Direct Anthropic connection is not configured on the server']);
        exit;
    }

    $url = 'https://api.anthropic.com/v1/messages';
    $payload = [
        'model'      => $model,
        'max_tokens' => 2048,
        'system'     => [['type' => 'text', 'text' => $system, 'cache_control' => ['type' => 'ephemeral']]],
        'messages'   => [['role' => 'user', 'content' => $prompt]]
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'x-api-key: ' . $anthropicApiKey,
        'anthropic-version: 2023-06-01',
        'anthropic-beta: prompt-caching-2024-07-31',
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 45);
    $response = curl_exec($ch);
    $httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpStatus !== 200) {
        http_response_code($httpStatus);
        echo json_encode(['error' => 'Direct Claude API error', 'details' => json_decode($response, true)]);
        exit;
    }

    $data = json_decode($response, true);
    echo json_encode(['text' => $data['content'][0]['text'] ?? '', 'model' => $model]);
    exit;

} else {
    // ➔ Call OpenRouter Chat Completions API
    if (!$openrouterApiKey) {
        http_response_code(500);
        echo json_encode(['error' => 'OpenRouter connection is not configured on the server']);
        exit;
    }

    $url = 'https://openrouter.ai/api/v1/chat/completions';
    $payload = [
        'model'      => $model,
        'messages'   => [
            ['role' => 'system', 'content' => $system],
            ['role' => 'user', 'content' => $prompt]
        ],
        'max_tokens' => 1500
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $openrouterApiKey,
        'Content-Type: application/json',
        'HTTP-Referer: https://thekpihub.com',
        'X-Title: The KPI Hub'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    $response = curl_exec($ch);
    $httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpStatus !== 200) {
        http_response_code($httpStatus);
        echo json_encode(['error' => 'OpenRouter completions failure', 'details' => json_decode($response, true)]);
        exit;
    }

    $data = json_decode($response, true);
    echo json_encode(['text' => $data['choices'][0]['message']['content'] ?? '', 'model' => $model]);
    exit;
}
exit;
?>
