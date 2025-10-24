<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Section;

class SectionSeeder extends Seeder
{
    public function run(): void
    {
        $sections = [
            // 🏫 Junior High School (JHS)
            'JHS Department',
            'Grade 7 - Our Lady of Lourdes',
            'Grade 8 - St. Joseph of Calasanz',
            'Grade 9 - St. Peter Damian',
            'Grade 10 - St. Gregory the Great',

            // 🎓 Senior High School (SHS)
            'SHS Department',
            'Grade 11 - St. Josef Freinademetz (ABM)',
            'Grade 11 - St. Josef Freinademetz (HUMSS)',
            'Grade 11 - St. Josef Freinademetz (STEM)',
            'Grade 12 - St. Dominic De Guzman (ABM)',
            'Grade 12 - St. Dominic De Guzman (HUMSS)',
            'Grade 12 - St. Dominic De Guzman (STEM)',
        ];

        foreach ($sections as $sec) {
            Section::create(['name' => $sec]);
        }
    }
}