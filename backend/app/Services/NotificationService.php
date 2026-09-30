<?php

namespace App\Services;

use App\Models\{Notification, NotificationPreference, Product, ProductBatch, PurchaseOrder, Service, User};

class NotificationService
{
    public function generate(): int
    {
        $created = 0;
        User::where('status', '!=', 'Inactivo')->each(function (User $user) use (&$created) {
            $preferences = NotificationPreference::firstOrCreate(['user_id' => $user->id]);

            if ($preferences->stock) {
                Product::where('active', true)->whereColumn('quantity', '<=', 'minimum_quantity')->each(function ($product) use ($user, &$created) {
                    $created += $this->create($user, 'stock', "Stock bajo: {$product->name}", "Quedan {$product->quantity} {$product->unit}.", 'high', "/products/{$product->id}", $product->id);
                });
            }
            if ($preferences->services) {
                Service::whereNotIn('status', ['Completado','Cancelado'])->where('scheduled_at', '<=', now()->addDays(7))->each(function ($service) use ($user, &$created) {
                    $late = $service->scheduled_at->isPast();
                    $created += $this->create($user, 'services', $late ? 'Servicio atrasado' : 'Servicio próximo', $service->title, $late ? 'high' : 'medium', "/services/{$service->id}", $service->id);
                });
            }
            if ($preferences->expirations) {
                ProductBatch::where(function ($query) { $query->where('expiration_date', '<=', now()->addDays(30))->orWhere('next_inspection_at', '<=', now()->addDays(30)); })->where('status', 'Activo')->each(function ($batch) use ($user, &$created) {
                    $created += $this->create($user, 'expirations', 'Lote por vencer o inspeccionar', "Lote {$batch->lot_number}", 'high', "/product-batches/{$batch->id}", $batch->id);
                });
            }
            if ($preferences->movements) {
                \App\Models\InventoryMovement::where('status', 'Pendiente')->each(function ($movement) use ($user, &$created) {
                    $created += $this->create($user, 'movements', 'Movimiento pendiente', $movement->folio, 'medium', "/movements/{$movement->id}", $movement->id);
                });
            }
            if ($preferences->purchases) {
                PurchaseOrder::whereIn('status', ['Enviada','Parcial'])->whereNotNull('expected_date')->where('expected_date', '<=', now()->addDays(7))->each(function ($order) use ($user, &$created) {
                    $created += $this->create($user, 'purchases', 'Compra pendiente de recepción', $order->folio, 'medium', "/purchase-orders/{$order->id}", $order->id);
                });
            }
        });

        return $created;
    }

    public function create(User $user, string $type, string $title, string $message, string $priority = 'medium', ?string $url = null, string|int|null $subject = null, array $data = []): int
    {
        $key = implode(':', [$user->id, $type, $subject ?? md5($title.$message), now()->toDateString()]);
        return Notification::firstOrCreate(['dedupe_key' => $key], [
            'user_id'=>$user->id, 'type'=>$type, 'title'=>$title, 'message'=>$message,
            'priority'=>$priority, 'action_url'=>$url, 'data'=>$data,
        ])->wasRecentlyCreated ? 1 : 0;
    }
}
