<?php
namespace App\Models;
use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Supplier extends Model
{
    use Auditable;
    protected $fillable = ['name', 'category', 'contact_name', 'phone', 'email', 'rating', 'status'];
    protected function casts(): array { return ['rating' => 'decimal:1']; }
    public function products(): BelongsToMany { return $this->belongsToMany(Product::class, 'supplier_products'); }
    public function movements(): HasMany { return $this->hasMany(InventoryMovement::class); }
    public function purchaseOrders(): HasMany { return $this->hasMany(PurchaseOrder::class); }
}
