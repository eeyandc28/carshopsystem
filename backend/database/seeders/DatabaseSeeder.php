<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@carshop.com'],
            [
                'name' => 'Admin User',
                'password' => 'password', // Plain text — User model 'hashed' cast handles hashing
                'role' => 'admin',
            ]
        );

        $this->call(SystemSeeder::class);
    }
}
