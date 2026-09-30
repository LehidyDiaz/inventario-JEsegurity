<?php
namespace Database\Factories;
use App\Models\{Role, User};
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
/** @extends Factory<User> */
class UserFactory extends Factory
{
    public function definition(): array
    {
        return ['role_id'=>Role::firstOrCreate(['name'=>'Operador'])->id,'full_name'=>fake()->name(),'email'=>fake()->unique()->safeEmail(),'password_hash'=>Hash::make('password'),'status'=>'Disponible'];
    }
}
