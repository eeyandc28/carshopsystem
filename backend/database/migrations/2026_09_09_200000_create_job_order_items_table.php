<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('job_orders', 'estimated_cost')) {
            Schema::table('job_orders', function (Blueprint $table) {
                $table->decimal('estimated_cost', 10, 2)->default(0)->after('status');
            });
        }

        if (!Schema::hasColumn('job_orders', 'actual_cost')) {
            Schema::table('job_orders', function (Blueprint $table) {
                $table->decimal('actual_cost', 10, 2)->default(0)->after('estimated_cost');
            });
        }

        if (!Schema::hasTable('job_order_items')) {
            Schema::create('job_order_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('job_order_id')->constrained('job_orders')->cascadeOnDelete();
                $table->foreignId('inventory_id')->nullable()->constrained('inventories')->nullOnDelete();
                $table->string('item_type')->default('part');
                $table->string('description');
                $table->decimal('quantity', 10, 2)->default(1);
                $table->decimal('unit_price', 10, 2)->default(0);
                $table->decimal('total_price', 10, 2)->default(0);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('job_order_items');
        Schema::table('job_orders', function (Blueprint $table) {
            $table->dropColumn(['estimated_cost', 'actual_cost']);
        });
    }
};
