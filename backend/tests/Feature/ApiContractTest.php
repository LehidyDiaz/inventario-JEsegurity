<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiContractTest extends TestCase
{
    use RefreshDatabase;

    public function test_frontend_resources_return_the_expected_shape(): void
    {
        $this->seed(DatabaseSeeder::class);
        User::where('email', 'admin@jesegurity.com')->update(['api_token' => hash('sha256', 'test-token')]);

        $this->withToken('test-token')->getJson('/api/products')->assertOk()->assertJsonStructure([
            '*' => ['id', 'name', 'sku', 'categoryId', 'category', 'purchasePrice', 'quantity', 'minimum', 'unit', 'locationId', 'location', 'status', 'updatedAt'],
        ]);
        $this->withToken('test-token')->getJson('/api/suppliers')->assertOk()->assertJsonStructure([
            '*' => ['id', 'name', 'productIds', 'products'],
        ]);
        $this->withToken('test-token')->getJson('/api/services')->assertOk()->assertJsonStructure([
            '*' => ['id', 'clientId', 'client', 'scheduledAt', 'assignedUserIds', 'assignedTo'],
        ]);

        $productId = $this->withToken('test-token')->getJson('/api/products')->json('0.id');
        $this->withToken('test-token')->postJson('/api/movements', [
            'type' => 'out',
            'reference' => 'Contrato frontend',
            'status' => 'Pendiente',
            'date' => '2026-09-30 10:00:00',
            'items' => [['productId' => $productId, 'quantity' => 1]],
        ])->assertCreated()->assertJsonStructure([
            'id', 'date', 'user', 'items' => [['productId', 'product', 'category', 'quantity', 'unit']],
        ]);
    }
}
