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
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('plate_number')->unique();
            $table->string('vin')->unique();
            $table->string('engine_number')->nullable();
            $table->string('brand');
            $table->string('model');
            $table->year('year');
            $table->string('transmission');
            $table->string('fuel_type');
            $table->integer('mileage');
            $table->string('color');
            $table->string('photo_path')->nullable();
            $table->string('orcr_path')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
