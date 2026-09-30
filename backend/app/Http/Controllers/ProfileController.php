<?php

namespace App\Http\Controllers;

use Illuminate\Http\{Request};
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ProfileController extends ApiController
{
    public function show(Request $request): array { return $this->user($request->user()->load('role')); }
    public function update(Request $request): array
    {
        $d=$request->validate(['name'=>'sometimes|required|string|max:120','phone'=>'sometimes|nullable|string|max:30','department'=>'sometimes|nullable|string|max:100','location'=>'sometimes|nullable|string|max:120','shift'=>'sometimes|nullable|in:Turno A,Turno B','currentPassword'=>'required_with:password|string','password'=>'sometimes|string|min:8|confirmed']);
        $user=$request->user();
        if(isset($d['password'])) { if(!Hash::check($d['currentPassword'],$user->password_hash)) throw ValidationException::withMessages(['currentPassword'=>['La contraseña actual no es correcta.']]); $d['password_hash']=Hash::make($d['password']); }
        if(array_key_exists('name',$d)) $d['full_name']=$d['name'];
        unset($d['name'],$d['currentPassword'],$d['password'],$d['password_confirmation']);
        $user->update($d);
        return $this->user($user->load('role'));
    }
}
