<?php

namespace Tests\Feature;

use App\Models\{AuditLog, Category, Notification, Product, Role, Supplier, User};
use App\Services\AuditService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class OperationsExpansionTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $operator;
    private Product $product;
    private Supplier $supplier;

    protected function setUp(): void
    {
        parent::setUp();
        $adminRole=Role::create(['name'=>'Administrador']);
        $operatorRole=Role::create(['name'=>'Operador']);
        $this->admin=$this->user($adminRole,'admin-token','admin@test.local','Admin');
        $this->operator=$this->user($operatorRole,'operator-token','operator@test.local','Operador');
        $category=Category::create(['name'=>'Extintores']);
        $this->product=Product::create(['name'=>'Extintor ABC','sku'=>'EXT-T01','category_id'=>$category->id,'unit'=>'unidades','purchase_price'=>100,'quantity'=>10,'minimum_quantity'=>10]);
        $this->supplier=Supplier::create(['name'=>'Proveedor Test','status'=>'Activo']);
        $this->supplier->products()->attach($this->product);
    }

    public function test_notifications_are_generated_once_and_can_be_read(): void
    {
        $this->withToken('admin-token')->postJson('/api/notifications/refresh')->assertOk()->assertJson(['created'=>2]);
        $this->withToken('admin-token')->postJson('/api/notifications/refresh')->assertOk()->assertJson(['created'=>0]);
        $notification=Notification::where('user_id',$this->admin->id)->firstOrFail();
        $this->withToken('admin-token')->getJson('/api/notifications?unread=1')->assertOk()->assertJsonPath('0.readAt',null);
        $this->withToken('admin-token')->patchJson("/api/notifications/{$notification->id}/read")->assertOk()->assertJsonStructure(['id','actionUrl','readAt']);
        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_audit_api_redacts_secrets(): void
    {
        AuditService::record('update','users',$this->admin->id,['password_hash'=>'old','name'=>'Before'],['api_token'=>'secret','password'=>'secret','name'=>'After']);
        $log=AuditLog::latest('id')->firstOrFail();
        $this->assertSame(['name'=>'Before'],$log->old_values);
        $this->assertSame(['name'=>'After'],$log->new_values);
        $this->withToken('admin-token')->getJson('/api/audit-logs?action=update')->assertOk()->assertJsonMissing(['api_token'=>'secret'])->assertJsonPath('0.newValues.name','After');
    }

    public function test_batches_validate_and_return_camel_case(): void
    {
        $response=$this->withToken('admin-token')->postJson('/api/product-batches',['productId'=>$this->product->id,'lotNumber'=>'L-2026-01','serialNumber'=>'SER-001','quantity'=>2,'expirationDate'=>now()->addDays(15)->toDateString(),'nextInspectionAt'=>now()->addDays(5)->toDateString(),'status'=>'Activo','notes'=>'Inspección mensual'])->assertCreated()->assertJsonPath('lotNumber','L-2026-01')->assertJsonPath('productId',$this->product->id);
        $this->withToken('admin-token')->getJson('/api/expirations/summary')->assertOk()->assertJson(['upcoming'=>1,'inspectionsDue'=>1]);
        $this->withToken('admin-token')->putJson('/api/product-batches/'.$response->json('id'),['productId'=>$this->product->id,'lotNumber'=>'L-2026-01','quantity'=>-1,'status'=>'Activo'])->assertUnprocessable()->assertJsonValidationErrors('quantity');
    }

    public function test_purchase_receipt_updates_stock_and_creates_confirmed_movement(): void
    {
        $order=$this->withToken('admin-token')->postJson('/api/purchase-orders',['supplierId'=>$this->supplier->id,'orderDate'=>now()->toDateString(),'expectedDate'=>now()->addDay()->toDateString(),'status'=>'Enviada','items'=>[['productId'=>$this->product->id,'orderedQuantity'=>4,'unitPrice'=>100]]])->assertCreated()->assertJsonPath('total',400)->json();
        $this->assertMatchesRegularExpression('/^OC-\d{4}-\d{6}$/',$order['folio']);
        $this->withToken('admin-token')->postJson("/api/purchase-orders/{$order['id']}/receive",['items'=>[['itemId'=>$order['items'][0]['id'],'quantity'=>3]]])->assertOk()->assertJsonPath('status','Parcial')->assertJsonPath('items.0.receivedQuantity',3);
        $this->assertEquals(13,(float)$this->product->fresh()->quantity);
        $this->assertDatabaseHas('inventory_movements',['reference'=>$order['folio'],'status'=>'Confirmado']);
        $this->withToken('admin-token')->postJson("/api/purchase-orders/{$order['id']}/receive",['items'=>[['itemId'=>$order['items'][0]['id'],'quantity'=>2]]])->assertUnprocessable();
        $this->assertEquals(13,(float)$this->product->fresh()->quantity);
    }

    public function test_operator_is_forced_pending_and_approval_applies_stock(): void
    {
        $movement=$this->withToken('operator-token')->postJson('/api/movements',['type'=>'out','reference'=>'','status'=>'Confirmado','date'=>now()->toDateTimeString(),'items'=>[['productId'=>$this->product->id,'quantity'=>2]]])->assertCreated()->assertJsonPath('status','Pendiente')->json();
        $this->assertEquals(10,(float)$this->product->fresh()->quantity);
        $this->assertMatchesRegularExpression('/^MOV-\d{4}-\d{6}$/',$movement['folio']);
        $this->assertSame($movement['folio'],$movement['reference']);
        $this->withToken('admin-token')->postJson("/api/movements/{$movement['id']}/approve")->assertOk()->assertJsonPath('status','Confirmado');
        $this->assertEquals(8,(float)$this->product->fresh()->quantity);
        $this->assertDatabaseHas('audit_logs',['action'=>'approve','auditable_id'=>$movement['id']]);
        $this->assertDatabaseHas('notifications',['user_id'=>$this->operator->id,'type'=>'movements']);
    }

    public function test_trace_search_profile_label_and_report_contracts(): void
    {
        $this->withToken('admin-token')->getJson("/api/products/{$this->product->id}/trace")->assertOk()->assertJsonStructure(['product'=>['id','sku'],'movements','batches','suppliers','services','purchases','totals'=>['currentStock']]);
        $this->withToken('admin-token')->getJson("/api/products/{$this->product->id}/label")->assertOk()->assertJsonPath('sku','EXT-T01');
        $this->withToken('admin-token')->getJson('/api/search?q=Extintor')->assertOk()->assertJsonPath('0.section','products')->assertJsonStructure([['section','id','action']]);
        $this->withToken('admin-token')->putJson('/api/profile',['name'=>'Administrador Actualizado','phone'=>'+56 9 1234 5678','department'=>'Operaciones','location'=>'Santiago','shift'=>'Turno A'])->assertOk()->assertJsonPath('name','Administrador Actualizado')->assertJsonPath('department','Operaciones');
        $this->withToken('admin-token')->getJson('/api/reports/dashboard')->assertOk()->assertJsonStructure(['inventoryValue','totalProducts','lowStock','pendingMovements','upcomingServices','overdueServices']);
        $this->withToken('admin-token')->get('/api/reports/inventory/csv')->assertOk()->assertHeader('content-type','text/csv; charset=UTF-8');
    }

    public function test_password_reset_is_neutral_and_uses_expiring_token(): void
    {
        $this->postJson('/api/forgot-password',['email'=>$this->admin->email])->assertOk()->assertJsonMissing(['token']);
        $token=DB::table('password_reset_tokens')->where('email',$this->admin->email)->value('token');
        $this->postJson('/api/reset-password',['email'=>$this->admin->email,'token'=>$token,'password'=>'new-password-123','password_confirmation'=>'new-password-123'])->assertOk();
        $this->assertTrue(Hash::check('new-password-123',$this->admin->fresh()->password_hash));
        $this->assertDatabaseMissing('password_reset_tokens',['email'=>$this->admin->email]);
        $this->postJson('/api/forgot-password',['email'=>'missing@example.com'])->assertOk()->assertJsonPath('message','Si la cuenta existe, recibirás instrucciones para restablecer la contraseña.');
    }

    private function user(Role $role,string $token,string $email,string $name): User
    {
        return User::create(['role_id'=>$role->id,'full_name'=>$name,'email'=>$email,'password_hash'=>Hash::make('password123'),'api_token'=>hash('sha256',$token),'status'=>'Disponible']);
    }
}
