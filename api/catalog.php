<?php

declare(strict_types=1);
require __DIR__ . '/config.php';

$type = $_GET['type'] ?? '';
$definitions = [
    'categories' => ['table' => 'categories', 'label' => 'categoría', 'extra' => 'description'],
    'locations' => ['table' => 'locations', 'label' => 'ubicación', 'extra' => 'address'],
];

if (!isset($definitions[$type])) {
    json_response(['error' => 'Catálogo no válido.'], 404);
}

$definition = $definitions[$type];
$table = $definition['table'];
$extra = $definition['extra'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    require_auth();
    $where = $type === 'locations' ? 'where active = 1' : '';
    $statement = $pdo->query("select id, name, {$extra} from {$table} {$where} order by name");
    json_response($statement->fetchAll());
}

require_auth(['Administrador']);

$data = json_input();
$name = trim((string)($data['name'] ?? ''));
$extraValue = trim((string)($data[$extra] ?? ''));

if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT'], true) && $name === '') {
    json_response(['error' => "El nombre de la {$definition['label']} es obligatorio."], 422);
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $statement = $pdo->prepare("insert into {$table} (name, {$extra}) values (?, ?)");
        $statement->execute([$name, $extraValue ?: null]);
        json_response(['id' => (string)$pdo->lastInsertId()], 201);
    }

    $id = (int)($data['id'] ?? $_GET['id'] ?? 0);
    if ($id < 1) {
        json_response(['error' => "El id de la {$definition['label']} es obligatorio."], 422);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $statement = $pdo->prepare("update {$table} set name = ?, {$extra} = ? where id = ?");
        $statement->execute([$name, $extraValue ?: null, $id]);
        json_response(['ok' => true]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        if ($type === 'locations') {
            $statement = $pdo->prepare('update locations set active = 0 where id = ?');
        } else {
            $statement = $pdo->prepare('delete from categories where id = ?');
        }
        $statement->execute([$id]);
        json_response(['ok' => true]);
    }

    json_response(['error' => 'Método no permitido.'], 405);
} catch (PDOException $error) {
    $message = $type === 'categories'
        ? 'No se puede guardar o eliminar una categoría repetida o usada por productos.'
        : 'No se puede guardar una ubicación repetida.';
    json_response(['error' => $message], 409);
}

