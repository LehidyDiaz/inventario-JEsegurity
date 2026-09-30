<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

class AuditService
{
    private const SECRET_KEYS = ['password', 'password_hash', 'api_token', 'remember_token', 'token', 'currentPassword'];

    public static function record(string $action, Model|string $subject, ?int $id = null, array $old = [], array $new = [], ?string $description = null): AuditLog
    {
        $request = app()->bound('request') ? request() : null;
        $type = $subject instanceof Model ? $subject->getMorphClass() : $subject;
        $subjectId = $subject instanceof Model ? $subject->getKey() : $id;

        return AuditLog::create([
            'user_id' => $request?->user()?->id,
            'action' => $action,
            'auditable_type' => $type,
            'auditable_id' => $subjectId,
            'description' => $description ?? ucfirst($action).' '.$type.' #'.$subjectId,
            'old_values' => self::redact($old),
            'new_values' => self::redact($new),
            'ip' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'timestamp' => now(),
        ]);
    }

    private static function redact(array $values): array
    {
        return collect($values)->reject(fn ($value, $key) => in_array($key, self::SECRET_KEYS, true))->all();
    }
}
