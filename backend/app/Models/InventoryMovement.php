<?php
namespace App\Models;
use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class InventoryMovement extends Model
{
    use Auditable;
    protected $fillable = ['folio', 'type', 'reference', 'origin', 'status', 'movement_date', 'supplier_id', 'service_id', 'created_by', 'reviewed_by', 'rejection_reason', 'reviewed_at'];
    protected function casts(): array { return ['movement_date' => 'datetime', 'reviewed_at' => 'datetime']; }
    public function items(): HasMany { return $this->hasMany(InventoryMovementItem::class, 'movement_id'); }
    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
    public function service(): BelongsTo { return $this->belongsTo(Service::class); }
    public function creator(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
    public function reviewer(): BelongsTo { return $this->belongsTo(User::class, 'reviewed_by'); }
}
