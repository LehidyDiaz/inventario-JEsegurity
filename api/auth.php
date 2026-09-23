<?php

declare(strict_types=1);
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método no permitido.'], 405);
}

$data = json_input();
$email = strtolower(trim((string)($data['email'] ?? '')));
$password = (string)($data['password'] ?? '');

$statement = $pdo->prepare(
    'select u.id, u.full_name, u.email, u.password_hash, r.name as role
     from users u inner join roles r on r.id = u.role_id
     where u.email = ? and u.status <> \'Inactivo\''
);
$statement->execute([$email]);
$user = $statement->fetch();

if (!$user || !password_verify($password, (string)$user['password_hash'])) {
    json_response(['error' => 'Correo o contraseña incorrectos.'], 401);
}

$token = encode_token([
    'sub' => (int)$user['id'],
    'name' => $user['full_name'],
    'email' => $user['email'],
    'role' => $user['role'],
    'exp' => time() + 28800,
]);

json_response([
    'token' => $token,
    'user' => ['id' => (int)$user['id'], 'name' => $user['full_name'], 'email' => $user['email'], 'role' => $user['role']],
]);