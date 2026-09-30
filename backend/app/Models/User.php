<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['role_id', 'full_name', 'email', 'password_hash', 'api_token', 'phone', 'department', 'location', 'status', 'shift', 'rating', 'skills', 'next_assignment'])]
#[Hidden(['password_hash', 'api_token', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use Auditable, HasFactory;

    protected function casts(): array
    {
        return ['rating' => 'decimal:1', 'skills' => 'array'];
    }

    public function role(): BelongsTo { return $this->belongsTo(Role::class); }
    public function assignedServices(): BelongsToMany { return $this->belongsToMany(Service::class, 'service_assignments'); }
    public function notifications(): HasMany { return $this->hasMany(Notification::class); }
}
