<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class InventoryMovementItem extends Model
{
    public $timestamps = false;
    public $incrementing = false;
    protected $fillable = ['movement_id', 'product_id', 'quantity', 'previous_quantity'];
    protected function casts(): array { return ['quantity' => 'decimal:2', 'previous_quantity' => 'decimal:2']; }
    public function movement(): BelongsTo { return $this->belongsTo(InventoryMovement::class, 'movement_id'); }
    public function product(): BelongsTo { return $this->belongsTo(Product::class); }
}
