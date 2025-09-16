<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Teacher;
use Illuminate\Support\Facades\Hash;

class TeacherSeeder extends Seeder
{
    public function run(): void
    {
        // John Doe
        $user1 = User::create([
            'name' => 'John Doe',
            'email' => 'johndoe@edutrack.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
        ]);

        Teacher::create([
            'name' => 'John Doe',
            'user_id' => $user1->id,
            'department' => 'Mathematics',
            'subject_id' => 2,
        ]);

        // Jane Smith
        $user2 = User::create([
            'name' => 'Jane Smith',
            'email' => 'janesmith@edutrack.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
        ]);

        Teacher::create([
            'name' => 'Jane Smith',
            'user_id' => $user2->id,
            'department' => 'Science',
            'subject_id' => 3,
        ]);

        // Michael Johnson
        $user3 = User::create([
            'name' => 'Michael Johnson',
            'email' => 'mjohnson@edutrack.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
        ]);

        Teacher::create([
            'name' => 'Michael Johnson',
            'user_id' => $user3->id,
            'department' => 'English',
            'subject_id' => 1,
        ]);
    }
}