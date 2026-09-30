<?php
namespace App\Http\Controllers;
use App\Models\Role;
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Validation\Rule;
class RoleController extends ApiController
{
    public function index(): array { return Role::orderBy('name')->get()->map(fn($x)=>$this->role($x))->all(); }
    public function store(Request $r): JsonResponse { $x=Role::create($this->data($r)); return response()->json($this->role($x),201); }
    public function update(Request $r, Role $role): array { $role->update($this->data($r,$role)); return $this->role($role); }
    public function destroy(Role $role): JsonResponse { if($role->users()->exists()) return $this->conflict('El rol tiene usuarios asociados.'); $role->delete(); return response()->json(['message'=>'Rol eliminado.']); }
    private function data(Request $r, ?Role $x=null): array { return $r->validate(['name'=>['required','string','max:50',Rule::unique('roles')->ignore($x)],'description'=>['nullable','string','max:255']]); }
}
