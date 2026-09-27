<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $types = [
            ['name' => 'Labor', 'description' => 'Labor, work operations, and diagnostic services'],
            ['name' => 'Services', 'description' => 'General shop services, packages, and PMS'],
            ['name' => 'Parts', 'description' => 'Replacement parts, components, and hardware'],
            ['name' => 'Products', 'description' => 'Retail products and aftermarket accessories'],
            ['name' => 'Tires', 'description' => 'Tires, tubes, valves, and tire mounting components'],
            ['name' => 'Wheels', 'description' => 'Wheels, rims, lugs, and balancing accessories'],
            ['name' => 'Oils & Fluids', 'description' => 'Engine oils, gear oils, brake fluids, and lubricants'],
            ['name' => 'Charge / Fee', 'description' => 'Standard shop supplies, hazardous fees, and disposal charges'],
        ];

        foreach ($types as $type) {
            $existing = DB::table('inventory_types')->where('name', $type['name'])->first();
            if (!$existing) {
                DB::table('inventory_types')->insert([
                    'name'        => $type['name'],
                    'description' => $type['description'],
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Keep user data safe
    }
};
