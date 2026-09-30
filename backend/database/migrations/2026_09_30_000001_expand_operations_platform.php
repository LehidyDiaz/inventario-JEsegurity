<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sequences', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->unsignedBigInteger('value')->default(0);
            $table->timestamps();
        });

        Schema::table('inventory_movements', function (Blueprint $table) {
            $table->string('folio', 30)->nullable()->unique()->after('id');
            $table->text('rejection_reason')->nullable()->after('reviewed_by');
            $table->timestamp('reviewed_at')->nullable()->after('rejection_reason');
        });
        Schema::table('services', function (Blueprint $table) {
            $table->string('folio', 30)->nullable()->unique()->after('id');
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE inventory_movements MODIFY status VARCHAR(30) NOT NULL DEFAULT 'Pendiente'");
        } else {
            Schema::table('inventory_movements', function (Blueprint $table) {
                $table->string('status', 30)->default('Pendiente')->change();
            });
        }

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 50)->index();
            $table->string('title');
            $table->text('message');
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
            $table->string('action_url')->nullable();
            $table->timestamp('read_at')->nullable()->index();
            $table->json('data')->nullable();
            $table->string('dedupe_key')->nullable()->unique();
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
        });
        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained('users')->cascadeOnDelete();
            $table->boolean('stock')->default(true);
            $table->boolean('services')->default(true);
            $table->boolean('movements')->default(true);
            $table->boolean('expirations')->default(true);
            $table->boolean('purchases')->default(true);
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 40)->index();
            $table->string('auditable_type')->index();
            $table->unsignedBigInteger('auditable_id')->nullable()->index();
            $table->text('description');
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('timestamp')->useCurrent()->index();
        });

        Schema::create('product_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('lot_number', 100);
            $table->string('serial_number', 120)->nullable()->unique();
            $table->decimal('quantity', 12, 2)->default(0);
            $table->date('expiration_date')->nullable()->index();
            $table->date('next_inspection_at')->nullable()->index();
            $table->enum('status', ['Activo', 'Vencido', 'Consumido'])->default('Activo')->index();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['product_id', 'lot_number']);
        });

        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->string('folio', 30)->unique();
            $table->foreignId('supplier_id')->constrained('suppliers');
            $table->date('order_date');
            $table->date('expected_date')->nullable()->index();
            $table->enum('status', ['Borrador', 'Enviada', 'Parcial', 'Recibida', 'Cancelada'])->default('Borrador')->index();
            $table->text('notes')->nullable();
            $table->decimal('total', 14, 2)->default(0);
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamps();
        });
        Schema::create('purchase_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained('purchase_orders')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products');
            $table->decimal('ordered_quantity', 12, 2);
            $table->decimal('received_quantity', 12, 2)->default(0);
            $table->decimal('unit_price', 12, 2);
            $table->unique(['purchase_order_id', 'product_id']);
        });

        Schema::create('attachments', function (Blueprint $table) {
            $table->id();
            $table->string('entity_type', 40);
            $table->unsignedBigInteger('entity_id');
            $table->string('original_name');
            $table->string('path');
            $table->string('mime', 120);
            $table->unsignedBigInteger('size');
            $table->foreignId('uploaded_by')->constrained('users');
            $table->timestamps();
            $table->index(['entity_type', 'entity_id']);
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        DB::table('inventory_movements')->orderBy('id')->each(function ($row) {
            DB::table('inventory_movements')->where('id', $row->id)->update(['folio' => sprintf('MOV-%s-%06d', date('Y'), $row->id)]);
        });
        DB::table('services')->orderBy('id')->each(function ($row) {
            DB::table('services')->where('id', $row->id)->update(['folio' => sprintf('SRV-%s-%06d', date('Y'), $row->id)]);
        });
        foreach (['MOV' => 'inventory_movements', 'SRV' => 'services'] as $prefix => $table) {
            DB::table('sequences')->insert([
                'key' => $prefix.'-'.date('Y'),
                'value' => DB::table($table)->max('id') ?? 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('attachments');
        Schema::dropIfExists('purchase_order_items');
        Schema::dropIfExists('purchase_orders');
        Schema::dropIfExists('product_batches');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('notification_preferences');
        Schema::dropIfExists('notifications');
        Schema::table('services', fn (Blueprint $table) => $table->dropColumn('folio'));
        Schema::table('inventory_movements', function (Blueprint $table) {
            $table->dropColumn(['folio', 'rejection_reason', 'reviewed_at']);
        });
        Schema::dropIfExists('sequences');
    }
};
