<?php
namespace Tests\Feature;
use App\Models\{Category, Product, Role, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
class MovementTest extends TestCase
{
    use RefreshDatabase;
    protected User $user;
    protected Product $product;
    protected function setUp(): void
    {
        parent::setUp();
        $role=Role::create(['name'=>'Supervisor']);
        $this->user=User::create(['role_id'=>$role->id,'full_name'=>'Supervisor','email'=>'supervisor@example.com','password_hash'=>Hash::make('secret'),'status'=>'Disponible','api_token'=>hash('sha256','test-token')]);
        $category=Category::create(['name'=>'Test']);
        $this->product=Product::create(['name'=>'Producto','sku'=>'MOV-001','category_id'=>$category->id,'unit'=>'unidades','purchase_price'=>1,'quantity'=>10,'minimum_quantity'=>1]);
    }
    public function test_confirmed_movement_updates_and_delete_reverts_stock(): void
    {
        $response=$this->withToken('test-token')->postJson('/api/movements',$this->payload(3))->assertCreated();
        $this->assertEquals(7,(float)$this->product->fresh()->quantity);
        $this->withToken('test-token')->deleteJson('/api/movements/'.$response->json('id'))->assertOk();
        $this->assertEquals(10,(float)$this->product->fresh()->quantity);
    }
    public function test_out_movement_rejects_insufficient_stock_atomically(): void
    {
        $this->withToken('test-token')->postJson('/api/movements',$this->payload(11))->assertUnprocessable()->assertJsonValidationErrors('items');
        $this->assertEquals(10,(float)$this->product->fresh()->quantity);
        $this->assertDatabaseCount('inventory_movements',0);
    }
    private function payload(float $quantity): array { return ['type'=>'out','reference'=>'Servicio test','status'=>'Confirmado','date'=>'2026-09-30 10:00:00','items'=>[['productId'=>$this->product->id,'quantity'=>$quantity]]]; }
}
