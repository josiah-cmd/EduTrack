<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Section;

class StudentSeeder extends Seeder
{
    public function run(): void
    {
        $path = storage_path('app/students.csv');
        if (!file_exists($path)) {
            $this->command->error('students.csv not found. Run ExtractStudents.php first.');
            return;
        }

        $rows = array_map('str_getcsv', file($path));
        array_shift($rows); // remove header row

        $emailTracker = [];

        foreach ($rows as $row) {
            [$name, $email, $grade, $sectionName, $lrn] = $row;

            if (empty($lrn)) continue; // skip if no LRN

            // 🧹 Clean name properly
            $name = trim(preg_replace('/\s+/', ' ', ucwords(strtolower($name))));

            // 🧩 Rebuild clean base email from name (ignore numbers)
            $parts = preg_split('/\s+/', trim($name));
            $first = strtolower(preg_replace('/[^a-z]/', '', $parts[0] ?? ''));
            $last  = strtolower(preg_replace('/[^a-z]/', '', end($parts) ?? ''));
            $baseEmail = $first . $last . '@edutrack.com';

            // 🛡️ Handle duplicate emails safely
            $email = $baseEmail;
            $counter = 1;
            while (isset($emailTracker[$email]) || User::where('email', $email)->exists()) {
                $counter++;
                $email = $first . $last . $counter . '@edutrack.com';
            }
            $emailTracker[$email] = true;

            // 🧭 Match section from database (if exists)
            $section = Section::where('name', $sectionName)->first();

            // ✅ Use LRN as unique key to safely re-run
            User::updateOrCreate(
                ['lrn' => $lrn],
                [
                    'name'        => $name,
                    'email'       => $email,
                    'password'    => Hash::make('password'),
                    'role'        => 'student',
                    'grade_level' => $grade,
                    'section_id'  => $section?->id,
                ]
            );
        }

        $this->command->info('✅ All students imported successfully with cleaned names and unique emails!');
    }
} 