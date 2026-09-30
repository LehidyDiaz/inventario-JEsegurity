<?php
namespace App\Models;
use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Product extends Model
{
    use Auditable;
    protected $fillable = ['name', 'sku', 'category_id', 'unit', 'purchase_price', 'quantity', 'minimum_quantity', 'location_id', 'active'];
    protected function casts(): array { return ['purchase_price' => 'decimal:2', 'quantity' => 'decimal:2', 'minimum_quantity' => 'decimal:2', 'active' => 'boolean']; }
    public function category(): BelongsTo { return $this->belongsTo(Category::class); }
    public function location(): BelongsTo { return $this->belongsTo(Location::class); }
    public function suppliers(): BelongsToMany { return $this->belongsToMany(Supplier::class, 'supplier_products'); }
    public function movementItems(): HasMany { return $this->hasMany(InventoryMovementItem::class); }
    public function batches(): HasMany { return $this->hasMany(ProductBatch::class); }
    public function purchaseItems(): HasMany { return $this->hasMany(PurchaseOrderItem::class); }
}
