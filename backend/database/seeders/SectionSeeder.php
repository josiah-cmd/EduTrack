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
            [
                'name' => 'Grade 7 - Our Lady of Lourdes',
                'department' => 'JHS',
                'grade_level' => 'Grade 7',
                'strand' => null
            ],
            [
                'name' => 'Grade 8 - St. Joseph of Calasanz',
                'department' => 'JHS',
                'grade_level' => 'Grade 8',
                'strand' => null
            ],
            [
                'name' => 'Grade 9 - St. Peter Damian',
                'department' => 'JHS',
                'grade_level' => 'Grade 9',
                'strand' => null
            ],
            [
                'name' => 'Grade 10 - St. Gregory the Great',
                'department' => 'JHS',
                'grade_level' => 'Grade 10',
                'strand' => null
            ],

            // 🎓 Senior High School (SHS)
            [
                'name' => 'Grade 11 - St. Josef Freinademetz',
                'department' => 'SHS',
                'grade_level' => 'Grade 11',
                'strand' => 'ABM'
            ],
            [
                'name' => 'Grade 11 - St. Josef Freinademetz',
                'department' => 'SHS',
                'grade_level' => 'Grade 11',
                'strand' => 'HUMSS'
            ],
            [
                'name' => 'Grade 11 - St. Josef Freinademetz',
                'department' => 'SHS',
                'grade_level' => 'Grade 11',
                'strand' => 'STEM'
            ],
            [
                'name' => 'Grade 12 - St. Dominic De Guzman',
                'department' => 'SHS',
                'grade_level' => 'Grade 12',
                'strand' => 'ABM'
            ],
            [
                'name' => 'Grade 12 - St. Dominic De Guzman',
                'department' => 'SHS',
                'grade_level' => 'Grade 12',
                'strand' => 'HUMSS'
            ],
            [
                'name' => 'Grade 12 - St. Dominic De Guzman',
                'department' => 'SHS',
                'grade_level' => 'Grade 12',
                'strand' => 'STEM'
            ],
        ];

        foreach ($sections as $sec) {
            Section::create($sec);
        }
    }
}