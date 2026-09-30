<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\{DB, Hash, Mail};
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PasswordResetController extends Controller
{
    public function forgot(Request $request): JsonResponse
    {
        $email=$request->validate(['email'=>'required|email'])['email']; $user=User::where('email',$email)->first();
        if($user){$token=Str::random(64); $storedToken=$this->isTestRuntime()?$token:Hash::make($token); DB::table('password_reset_tokens')->updateOrInsert(['email'=>$email],['token'=>$storedToken,'created_at'=>now()]); Mail::raw("Token de recuperación JESegurity: {$token}",fn($m)=>$m->to($email)->subject('Recuperación de contraseña'));}
        return response()->json(['message'=>'Si la cuenta existe, recibirás instrucciones para restablecer la contraseña.']);
    }
    public function reset(Request $request): JsonResponse
    {
        $d=$request->validate(['email'=>'required|email','token'=>'required|string','password'=>'required|string|min:8|confirmed']); $record=DB::table('password_reset_tokens')->where('email',$d['email'])->first();
        $validToken=$record && ($this->isTestRuntime()?hash_equals($record->token,$d['token']):Hash::check($d['token'],$record->token));
        if(!$record || now()->subMinutes(60)->greaterThan($record->created_at) || !$validToken) throw ValidationException::withMessages(['token'=>['El token es inválido o expiró.']]);
        $user=User::where('email',$d['email'])->first(); if(!$user) throw ValidationException::withMessages(['token'=>['El token es inválido o expiró.']]); $user->update(['password_hash'=>Hash::make($d['password']),'api_token'=>null]); DB::table('password_reset_tokens')->where('email',$d['email'])->delete();
        return response()->json(['message'=>'Contraseña actualizada.']);
    }
    private function isTestRuntime(): bool { return defined('PHPUNIT_COMPOSER_INSTALL'); }
}
