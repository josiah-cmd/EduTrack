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
        $teachers = [
            ['name' => 'Kristal Mae L. Magsano', 'email' => 'kmagsano@edutrack.com', 'department' => 'English'],
            ['name' => 'Rose Marie R. Untalan', 'email' => 'runtalan@edutrack.com', 'department' => 'Filipino'],
            ['name' => 'Jocelyn R. Palad', 'email' => 'jpalad@edutrack.com', 'department' => 'Mathematics'],
            ['name' => 'Viencent John Andro R. Bernardino', 'email' => 'vbernardino@edutrack.com', 'department' => 'Science'],
            ['name' => 'Ed Ballesteros', 'email' => 'eballesteros@edutrack.com', 'department' => 'Values / Religion / ICT'],
            ['name' => 'Angel Claire B. Palomar', 'email' => 'apalomar@edutrack.com', 'department' => 'Araling Panlipunan'],
            ['name' => 'Christine M. Melendez', 'email' => 'cmelendez@edutrack.com', 'department' => 'Mathematics / Business'],
            ['name' => 'Carmelita S. Cuña', 'email' => 'ccuna@edutrack.com', 'department' => 'Values Education / Religion'],
            ['name' => 'April Joy M. Austria', 'email' => 'aaustria@edutrack.com', 'department' => 'Science / Values'],
            ['name' => 'Derick S. Delos Santos', 'email' => 'ddelossantos@edutrack.com', 'department' => 'TLE / Research'],
            ['name' => 'Esmeraldo O. Baguio', 'email' => 'ebaguio@edutrack.com', 'department' => 'Chinese'],
            ['name' => 'Ma. Angela S. Maningding', 'email' => 'maningding@edutrack.com', 'department' => 'MAPEH / Health'],
            ['name' => 'Danica C. Visperas', 'email' => 'dvisperas@edutrack.com', 'department' => 'Values Education'],
            ['name' => 'Christian N. Estrada', 'email' => 'cestrada@edutrack.com', 'department' => 'MAPEH'],
            ['name' => 'Jamaica Jeed P. Abalos', 'email' => 'jabalos@edutrack.com', 'department' => 'MAPEH / Values'],
            ['name' => 'Jebby P. Panlilio', 'email' => 'jpanlilio@edutrack.com', 'department' => 'Computer / TLE'],
            ['name' => 'Jayson Caballero', 'email' => 'jcaballero@edutrack.com', 'department' => 'ABM / Business'],
            ['name' => 'Myra B. Macaraeg', 'email' => 'mmacaraeg@edutrack.com', 'department' => 'Library Science'],
            ['name' => 'Alfredo Melendez', 'email' => 'amelendez@edutrack.com', 'department' => 'MAPEH'],
        ];

        foreach ($teachers as $data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make('password'),
                'role' => 'teacher',
            ]);

            Teacher::create([
                'name' => $data['name'],
                'user_id' => $user->id,
                'department' => $data['department'],
                'subject_id' => null, // optional; link later
            ]);
        }
    }
}