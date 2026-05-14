<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Vehicle;
use App\Models\Inventory;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SystemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create Suppliers
        $suppliers = [
            ['name' => 'AutoParts Pro', 'contact_person' => 'John Smith', 'contact_number' => '555-0101', 'email' => 'sales@autoparts.com'],
            ['name' => 'Global Tires', 'contact_person' => 'Jane Doe', 'contact_number' => '555-0102', 'email' => 'info@globaltires.com'],
        ];

        foreach ($suppliers as $s) {
            Supplier::create($s);
        }

        // 2. Create Customers & Vehicles
        $customers = [
            [
                'full_name' => 'Michael Corleone',
                'contact_number' => '09123456789',
                'email' => 'michael@example.com',
                'address' => '123 Godfather St, New York',
                'vehicles' => [
                    [
                        'plate_number' => 'ABC-1234',
                        'vin' => 'VIN1234567890',
                        'brand' => 'Cadillac',
                        'model' => 'Fleetwood',
                        'year' => 1955,
                        'transmission' => 'Manual',
                        'fuel_type' => 'Gasoline',
                        'mileage' => 120000,
                        'color' => 'Black'
                    ]
                ]
            ],
            [
                'full_name' => 'Sarah Connor',
                'contact_number' => '09876543210',
                'email' => 'sarah@resistance.com',
                'address' => '456 Cyberdyne Blvd, Los Angeles',
                'vehicles' => [
                    [
                        'plate_number' => 'T800-SKY',
                        'vin' => 'VIN0987654321',
                        'brand' => 'Jeep',
                        'model' => 'Renegade',
                        'year' => 1984,
                        'transmission' => 'Manual',
                        'fuel_type' => 'Diesel',
                        'mileage' => 45000,
                        'color' => 'Military Green'
                    ]
                ]
            ],
            [
                'full_name' => 'Tony Stark',
                'contact_number' => '09998887776',
                'email' => 'tony@starkindustries.com',
                'address' => '10880 Malibu Point, California',
                'vehicles' => [
                    [
                        'plate_number' => 'STARK-1',
                        'vin' => 'VIN1122334455',
                        'brand' => 'Audi',
                        'model' => 'R8',
                        'year' => 2023,
                        'transmission' => 'Automatic',
                        'fuel_type' => 'Electric',
                        'mileage' => 500,
                        'color' => 'Red/Gold'
                    ]
                ]
            ]
        ];

        foreach ($customers as $cData) {
            $vData = $cData['vehicles'];
            unset($cData['vehicles']);
            
            $customer = Customer::create($cData);
            
            foreach ($vData as $v) {
                $v['customer_id'] = $customer->id;
                Vehicle::create($v);
            }
        }

        // 3. Create Inventory Items
        $inventory = [
            ['name' => 'Synthetic Oil 5W-30', 'part_number' => 'OIL-001', 'brand' => 'Castrol', 'stock_quantity' => 50, 'unit_price' => 15.00],
            ['name' => 'Brake Pads (Front)', 'part_number' => 'BRK-101', 'brand' => 'Brembo', 'stock_quantity' => 20, 'unit_price' => 45.00],
            ['name' => 'Oil Filter', 'part_number' => 'FLT-001', 'brand' => 'Toyota', 'stock_quantity' => 30, 'unit_price' => 12.00],
            ['name' => 'Spark Plug', 'part_number' => 'SPK-001', 'brand' => 'NGK', 'stock_quantity' => 100, 'unit_price' => 8.00],
        ];

        foreach ($inventory as $i) {
            $i['supplier_id'] = 1; // Assign to first supplier
            Inventory::create($i);
        }
    }
}
