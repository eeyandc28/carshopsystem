<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if admin already exists
        $admin = User::where('email', 'admin@carshop.com')->first();
        
        if (!$admin) {
            User::create([
                'name' => 'Admin User',
                'email' => 'admin@carshop.com',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]);
        }
    }
}
