<?php
namespace Tests\Feature;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class ProductTest extends TestCase
{
    use RefreshDatabase;
    protected User $admin;
    protected function setUp(): void { parent::setUp(); $this->seed(DatabaseSeeder::class); $this->admin=User::where('email','admin@jesegurity.com')->firstOrFail(); $this->admin->update(['api_token'=>hash('sha256','test-token')]); }
    public function test_admin_can_create_update_and_deactivate_product(): void
    {
        $categoryId=\App\Models\Category::first()->id; $locationId=\App\Models\Location::first()->id;
        $created=$this->withToken('test-token')->postJson('/api/products',['name'=>'Producto test','sku'=>'TEST-001','categoryId'=>$categoryId,'unit'=>'unidades','purchasePrice'=>10.5,'quantity'=>4,'minimum'=>2,'locationId'=>$locationId])->assertCreated()->assertJsonPath('sku','TEST-001');
        $id=$created->json('id');
        $this->withToken('test-token')->putJson("/api/products/$id",['name'=>'Producto editado','sku'=>'TEST-001','categoryId'=>$categoryId,'unit'=>'unidades','purchasePrice'=>11,'quantity'=>5,'minimum'=>2,'locationId'=>$locationId])->assertOk()->assertJsonPath('name','Producto editado');
        $this->withToken('test-token')->deleteJson("/api/products/$id")->assertOk();
        $this->assertDatabaseHas('products',['id'=>$id,'active'=>false]);
        $this->withToken('test-token')->getJson('/api/products')->assertOk()->assertJsonMissing(['id'=>$id]);
    }
}
