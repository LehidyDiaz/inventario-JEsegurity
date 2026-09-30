<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50)->unique();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained('roles');
            $table->string('full_name', 120);
            $table->string('email', 160)->unique();
            $table->string('password_hash');
            $table->string('api_token', 64)->nullable()->unique();
            $table->string('phone', 30)->nullable();
            $table->string('department', 100)->nullable();
            $table->string('location', 120)->nullable();
            $table->enum('status', ['Disponible', 'En campo', 'Capacitación', 'Inactivo'])->default('Disponible');
            $table->enum('shift', ['Turno A', 'Turno B'])->nullable();
            $table->decimal('rating', 2, 1)->nullable();
            $table->json('skills')->nullable();
            $table->string('next_assignment', 180)->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80)->unique();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120)->unique();
            $table->string('address')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name', 160);
            $table->string('sku', 80)->unique();
            $table->foreignId('category_id')->constrained('categories');
            $table->string('unit', 40)->default('unidades');
            $table->decimal('purchase_price', 12, 2)->default(0);
            $table->decimal('quantity', 12, 2)->default(0);
            $table->decimal('minimum_quantity', 12, 2)->default(0);
            $table->foreignId('location_id')->nullable()->constrained('locations');
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('name', 160);
            $table->string('category', 100)->nullable();
            $table->string('contact_name', 120)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('email', 160)->nullable();
            $table->decimal('rating', 2, 1)->nullable();
            $table->enum('status', ['Activo', 'En revisión', 'Inactivo'])->default('Activo');
            $table->timestamps();
        });

        Schema::create('supplier_products', function (Blueprint $table) {
            $table->foreignId('supplier_id')->constrained('suppliers')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->primary(['supplier_id', 'product_id']);
        });

        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('name', 160);
            $table->string('contact_name', 120)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('email', 160)->nullable();
            $table->string('address')->nullable();
            $table->timestamps();
        });

        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('title', 180);
            $table->foreignId('client_id')->nullable()->constrained('clients');
            $table->string('location', 180);
            $table->dateTime('scheduled_at')->index();
            $table->enum('type', ['Prevención', 'Mantenimiento', 'Capacitación']);
            $table->enum('status', ['Programado', 'En curso', 'Pendiente', 'Completado', 'Cancelado'])->default('Pendiente');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestamps();
        });

        Schema::create('service_assignments', function (Blueprint $table) {
            $table->foreignId('service_id')->constrained('services')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users');
            $table->primary(['service_id', 'user_id']);
        });

        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['in', 'out', 'adjustment']);
            $table->string('reference', 180);
            $table->string('origin', 180)->nullable();
            $table->enum('status', ['Confirmado', 'Pendiente', 'Revisión'])->default('Pendiente')->index();
            $table->dateTime('movement_date')->useCurrent()->index();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers');
            $table->foreignId('service_id')->nullable()->constrained('services');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->timestamps();
        });

        Schema::create('inventory_movement_items', function (Blueprint $table) {
            $table->foreignId('movement_id')->constrained('inventory_movements')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products');
            $table->decimal('quantity', 12, 2);
            $table->decimal('previous_quantity', 12, 2)->nullable();
            $table->primary(['movement_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_movement_items');
        Schema::dropIfExists('inventory_movements');
        Schema::dropIfExists('service_assignments');
        Schema::dropIfExists('services');
        Schema::dropIfExists('clients');
        Schema::dropIfExists('supplier_products');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('products');
        Schema::dropIfExists('locations');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('users');
        Schema::dropIfExists('roles');
    }
};
