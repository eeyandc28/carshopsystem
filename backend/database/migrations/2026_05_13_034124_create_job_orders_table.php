<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('job_orders', function (Blueprint $table) {
            $table->id();
            $table->string('job_order_number')->unique();
            $table->foreignId('vehicle_id')->constrained();
            $table->foreignId('service_advisor_id')->constrained('users');
            $table->foreignId('mechanic_id')->nullable()->constrained('users');
            $table->text('complaint');
            $table->text('diagnosis')->nullable();
            $table->text('repair_action')->nullable();
            $table->enum('status', ['pending', 'diagnosing', 'waiting_for_parts', 'in_progress', 'completed', 'released'])->default('pending');
            $table->date('estimated_completion')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_orders');
    }
};
