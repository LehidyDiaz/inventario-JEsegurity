<?php
namespace App\Models;
use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Client extends Model { use Auditable; protected $fillable = ['name', 'contact_name', 'phone', 'email', 'address']; public function services(): HasMany { return $this->hasMany(Service::class); } }
