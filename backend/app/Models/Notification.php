<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    protected $fillable = ['user_id', 'type', 'title', 'message', 'priority', 'action_url', 'read_at', 'data', 'dedupe_key'];
    protected function casts(): array { return ['read_at' => 'datetime', 'data' => 'array']; }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
