<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$host = getenv('DB_HOST') ?: 'mysql';
$database = getenv('DB_DATABASE') ?: 'jesegurity';
$username = getenv('DB_USERNAME') ?: 'jesegurity';
$password = getenv('DB_PASSWORD') ?: 'jesegurity';

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$database;charset=utf8mb4",
        $username,
        $password,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
} catch (PDOException $error) {
    http_response_code(500);
    echo json_encode(['error' => 'No se pudo conectar a MySQL. Revisa los contenedores y las credenciales.']);
    exit;
}

function json_input(): array
{
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
}

function json_response(mixed $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function auth_secret(): string
{
    return getenv('APP_KEY') ?: 'local-only-change-this-signing-key';
}

function encode_token(array $payload): string
{
    $body = rtrim(strtr(base64_encode(json_encode($payload)), '+/', '-_'), '=');
    $signature = hash_hmac('sha256', $body, auth_secret());
    return $body . '.' . $signature;
}

function authenticated_user(): ?array
{
    $header = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
    if ($header !== '' && !str_starts_with(strtolower($header), 'bearer ')) {
        $header = 'Bearer ' . $header;
    }
    if (!preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
        return null;
    }

    [$body, $signature] = array_pad(explode('.', $matches[1], 2), 2, '');
    $expected = hash_hmac('sha256', $body, auth_secret());
    if ($signature === '' || !hash_equals($expected, $signature)) {
        return null;
    }

    $encodedBody = strtr($body, '-_', '+/');
    $encodedBody .= str_repeat('=', (4 - strlen($encodedBody) % 4) % 4);
    $payload = json_decode(base64_decode($encodedBody), true);
    if (!is_array($payload) || (int)($payload['exp'] ?? 0) < time()) {
        return null;
    }

    return $payload;
}

function require_auth(array $roles = []): array
{
    $user = authenticated_user();
    if (!$user) {
        json_response(['error' => 'Debes iniciar sesión.'], 401);
    }
    if ($roles !== [] && !in_array($user['role'] ?? '', $roles, true)) {
        json_response(['error' => 'No tienes permisos para realizar esta acción.'], 403);
    }
    return $user;
}