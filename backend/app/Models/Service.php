<?php
namespace App\Models;
use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Service extends Model
{
    use Auditable;
    protected $fillable = ['folio', 'title', 'client_id', 'location', 'scheduled_at', 'type', 'status', 'notes', 'created_by'];
    protected function casts(): array { return ['scheduled_at' => 'datetime']; }
    public function client(): BelongsTo { return $this->belongsTo(Client::class); }
    public function creator(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
    public function assignedUsers(): BelongsToMany { return $this->belongsToMany(User::class, 'service_assignments'); }
    public function movements(): HasMany { return $this->hasMany(InventoryMovement::class); }
    protected static function booted(): void { static::creating(function($service){ if(!$service->folio && \Illuminate\Support\Facades\Schema::hasTable('sequences')) $service->folio=app(\App\Services\FolioService::class)->next('SRV'); }); }
}
