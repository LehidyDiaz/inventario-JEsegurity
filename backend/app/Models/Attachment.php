<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attachment extends Model
{
    protected $fillable = ['entity_type','entity_id','original_name','path','mime','size','uploaded_by'];
    public function uploader(): BelongsTo { return $this->belongsTo(User::class, 'uploaded_by'); }
}
