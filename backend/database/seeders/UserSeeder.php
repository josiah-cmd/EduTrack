<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run()
    {
        $roles = ['admin', 'teacher', 'staff', 'student'];

        foreach ($roles as $role) {
            User::create([
                'name' => ucfirst($role),
                'email' => $role . '@edutrack.com',
                'password' => Hash::make('password'),
                'role' => $role
            ]);
        }
    }
}

