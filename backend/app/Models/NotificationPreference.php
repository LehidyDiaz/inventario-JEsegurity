<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationPreference extends Model
{
    protected $attributes = ['stock'=>true,'services'=>true,'movements'=>true,'expirations'=>true,'purchases'=>true];
    protected $primaryKey = 'user_id';
    public $incrementing = false;
    protected $fillable = ['user_id', 'stock', 'services', 'movements', 'expirations', 'purchases'];
    protected function casts(): array { return ['stock'=>'boolean','services'=>'boolean','movements'=>'boolean','expirations'=>'boolean','purchases'=>'boolean']; }
}
