<?php
namespace App\Http\Middleware;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
class ApiTokenAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken() ?: $request->header('X-Auth-Token');
        $user = $token ? User::with('role')->where('api_token', hash('sha256', $token))->first() : null;
        if (! $user || $user->status === 'Inactivo') return response()->json(['message' => 'No autenticado.'], 401);
        $request->setUserResolver(fn () => $user);
        return $next($request);
    }
}
