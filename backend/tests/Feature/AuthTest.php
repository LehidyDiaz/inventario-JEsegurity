<?php
namespace Tests\Feature;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class AuthTest extends TestCase
{
    use RefreshDatabase;
    protected function setUp(): void { parent::setUp(); $this->seed(DatabaseSeeder::class); }
    public function test_admin_can_login_read_profile_and_logout(): void
    {
        $login=$this->postJson('/api/login',['email'=>'admin@jesegurity.com','password'=>'123456'])->assertOk()->assertJsonPath('user.role','Administrador')->assertJsonStructure(['token','user'=>['id','name','email','role']]);
        $token=$login->json('token');
        $this->withToken($token)->getJson('/api/me')->assertOk()->assertJsonPath('email','admin@jesegurity.com');
        $this->withToken($token)->postJson('/api/logout')->assertOk();
        $this->withToken($token)->getJson('/api/me')->assertUnauthorized();
    }
    public function test_protected_routes_require_authentication(): void { $this->getJson('/api/products')->assertUnauthorized(); }
}
