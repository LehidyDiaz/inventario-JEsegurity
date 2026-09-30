<?php

declare(strict_types=1);
require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $statement = $pdo->query(
        "select p.id, p.name, p.sku, c.name as category, p.quantity, p.minimum_quantity as minimum,
                p.unit, coalesce(l.name, 'Sin ubicación') as location, p.updated_at as updatedAt
         from products p
         inner join categories c on c.id = p.category_id
         left join locations l on l.id = p.location_id
         where p.active = 1 order by p.created_at desc"
    );
    json_response($statement->fetchAll());
}

$data = json_input();
$name = trim((string)($data['name'] ?? ''));
$sku = trim((string)($data['sku'] ?? ''));
$category = trim((string)($data['category'] ?? ''));
$location = trim((string)($data['location'] ?? ''));
$quantity = (float)($data['quantity'] ?? 0);
$minimum = (float)($data['minimum'] ?? 0);
$unit = trim((string)($data['unit'] ?? 'unidades')) ?: 'unidades';

if ($name === '' || $category === '' || $sku === '' || $quantity < 0 || $minimum < 0) {
    json_response(['error' => 'Nombre, SKU, categoría y cantidades válidas son obligatorios.'], 422);
}

$categoryStatement = $pdo->prepare('select id from categories where name = ?');
$categoryStatement->execute([$category]);
$categoryId = $categoryStatement->fetchColumn();
$locationStatement = $pdo->prepare('select id from locations where name = ?');
$locationStatement->execute([$location]);
$locationId = $locationStatement->fetchColumn() ?: null;

if (!$categoryId) {
    json_response(['error' => 'La categoría no existe en la tabla categories.'], 422);
}

try {
    if ($method === 'POST') {
        $statement = $pdo->prepare(
            'insert into products (name, sku, category_id, quantity, minimum_quantity, unit, location_id)
             values (?, ?, ?, ?, ?, ?, ?)'
        );
        $statement->execute([$name, $sku, $categoryId, $quantity, $minimum, $unit, $locationId]);
        json_response(['id' => (string)$pdo->lastInsertId()], 201);
    }

    if ($method === 'PUT') {
        $id = (int)($data['id'] ?? 0);
        if ($id < 1) {
            json_response(['error' => 'El id del producto es obligatorio.'], 422);
        }
        $statement = $pdo->prepare(
            'update products set name = ?, sku = ?, category_id = ?, quantity = ?, minimum_quantity = ?, unit = ?, location_id = ? where id = ?'
        );
        $statement->execute([$name, $sku, $categoryId, $quantity, $minimum, $unit, $locationId, $id]);
        json_response(['ok' => true]);
    }

    if ($method === 'DELETE') {
        $id = (int)($_GET['id'] ?? 0);
        $statement = $pdo->prepare('update products set active = 0 where id = ?');
        $statement->execute([$id]);
        json_response(['ok' => true]);
    }

    json_response(['error' => 'Método no permitido.'], 405);
} catch (PDOException $error) {
    json_response(['error' => 'No se pudo guardar el producto. Verifica que el SKU no esté repetido.'], 409);
}