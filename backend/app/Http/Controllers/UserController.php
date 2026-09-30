<?php
namespace App\Http\Controllers;
use App\Models\User;
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
class UserController extends ApiController
{
    public function index(): array { return User::with('role')->orderBy('full_name')->get()->map(fn($x)=>$this->user($x))->all(); }
    public function store(Request $r): JsonResponse { $d=$this->data($r); $d['password_hash']=Hash::make($d['password']); unset($d['password']); $x=User::create($this->map($d)); return response()->json($this->user($x->load('role')),201); }
    public function update(Request $r, User $user): array { $d=$this->data($r,$user); if(isset($d['password'])) $d['password_hash']=Hash::make($d['password']); unset($d['password']); $user->update($this->map($d)); return $this->user($user->load('role')); }
    public function destroy(Request $r, User $user): JsonResponse { if($r->user()->is($user)) return $this->conflict('No puedes desactivar tu propio usuario.'); $user->update(['status'=>'Inactivo','api_token'=>null]); return response()->json(['message'=>'Usuario desactivado.']); }
    private function data(Request $r, ?User $u=null): array { return $r->validate(['name'=>['required','string','max:120'],'email'=>['required','email','max:160',Rule::unique('users')->ignore($u)],'roleId'=>['required','integer','exists:roles,id'],'password'=>[$u?'nullable':'required','string','min:6','max:255'],'phone'=>['nullable','string','max:30'],'department'=>['nullable','string','max:100'],'location'=>['nullable','string','max:120'],'status'=>['required','in:Disponible,En campo,Capacitación,Inactivo'],'shift'=>['nullable','in:Turno A,Turno B'],'rating'=>['nullable','numeric','between:0,5'],'skills'=>['nullable','array'],'skills.*'=>['string','max:100'],'nextAssignment'=>['nullable','string','max:180']]); }
    private function map(array $d): array { $d['full_name']=$d['name']; $d['role_id']=$d['roleId']; $d['next_assignment']=$d['nextAssignment']??null; unset($d['name'],$d['roleId'],$d['nextAssignment']); return $d; }
}
