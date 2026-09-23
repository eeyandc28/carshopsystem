<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * NOTE: Do NOT use Hash::make() here — the User model has 'password' => 'hashed'
     * cast which auto-hashes on save. Using Hash::make() would double-hash the password.
     */
    public function run(): void
    {
        // Create or update admin user — pass plain text, model cast handles hashing
        User::updateOrCreate(
            ['email' => 'admin@carshop.com'],
            [
                'name' => 'Admin User',
                'password' => 'password',
                'role' => 'admin',
            ]
        );
    }
}
