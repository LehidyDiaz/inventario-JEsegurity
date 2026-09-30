<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductBatch extends Model
{
    use Auditable;
    protected $fillable = ['product_id', 'lot_number', 'serial_number', 'quantity', 'expiration_date', 'next_inspection_at', 'status', 'notes'];
    protected function casts(): array { return ['quantity'=>'decimal:2','expiration_date'=>'date','next_inspection_at'=>'date']; }
    public function product(): BelongsTo { return $this->belongsTo(Product::class); }
}
