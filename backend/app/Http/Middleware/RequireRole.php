<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
class RequireRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (! in_array($request->user()->role->name, $roles, true)) return response()->json(['message' => 'No tienes permisos para esta acción.'], 403);
        return $next($request);
    }
}
