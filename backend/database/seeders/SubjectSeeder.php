<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Subject;

class SubjectSeeder extends Seeder {
    public function run(): void {
        $subjects = ['English', 'Math', 'Science'];
        foreach ($subjects as $sub) {
            Subject::create(['name' => $sub]);
        }
    }
}

