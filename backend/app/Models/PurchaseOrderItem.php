<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderItem extends Model
{
    public $timestamps = false;
    protected $fillable = ['product_id','ordered_quantity','received_quantity','unit_price'];
    protected function casts(): array { return ['ordered_quantity'=>'decimal:2','received_quantity'=>'decimal:2','unit_price'=>'decimal:2']; }
    public function order(): BelongsTo { return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id'); }
    public function product(): BelongsTo { return $this->belongsTo(Product::class); }
}
