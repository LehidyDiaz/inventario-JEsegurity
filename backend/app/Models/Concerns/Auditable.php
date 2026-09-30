<?php

namespace App\Models\Concerns;

use App\Services\AuditService;

trait Auditable
{
    protected static function bootAuditable(): void
    {
        static::created(fn ($model) => AuditService::record('create', $model, new: $model->getAttributes()));
        static::updated(function ($model) {
            $changes = $model->getChanges();
            unset($changes['updated_at']);
            if ($changes !== []) {
                AuditService::record('update', $model, old: array_intersect_key($model->getOriginal(), $changes), new: $changes);
            }
        });
        static::deleted(fn ($model) => AuditService::record('delete', $model, old: $model->getOriginal()));
    }
}
