<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class FolioService
{
    public function next(string $prefix): string
    {
        $year = now()->format('Y');
        $key = "$prefix-$year";

        return DB::transaction(function () use ($prefix, $year, $key) {
            DB::table('sequences')->insertOrIgnore(['key' => $key, 'value' => 0, 'created_at' => now(), 'updated_at' => now()]);
            $sequence = DB::table('sequences')->where('key', $key)->lockForUpdate()->first();
            $value = $sequence->value + 1;
            DB::table('sequences')->where('key', $key)->update(['value' => $value, 'updated_at' => now()]);

            return sprintf('%s-%s-%06d', $prefix, $year, $value);
        });
    }
}
