<?php
namespace App\Http\Controllers;
use App\Models\User;
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Services\AuditService;
class AuthController extends ApiController
{
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email'], 'password' => ['required', 'string']]);
        $user = User::with('role')->where('email', $data['email'])->first();
        if (! $user || $user->status === 'Inactivo' || ! Hash::check($data['password'], $user->password_hash)) return response()->json(['message' => 'Credenciales incorrectas.'], 422);
        $token = Str::random(80);
        $user->update(['api_token' => hash('sha256', $token)]);
        AuditService::record('login', $user, description: 'Inicio de sesión exitoso');
        return response()->json(['token' => $token, 'user' => $this->user($user)]);
    }
    public function me(Request $request): array { return $this->user($request->user()); }
    public function logout(Request $request): JsonResponse { $request->user()->update(['api_token' => null]); return response()->json(['message' => 'Sesión cerrada.']); }
}
