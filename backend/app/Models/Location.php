<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Location extends Model { protected $fillable = ['name', 'address', 'active']; protected function casts(): array { return ['active' => 'boolean']; } public function products(): HasMany { return $this->hasMany(Product::class); } }
