<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Section;

class SectionSeeder extends Seeder {
    public function run(): void {
        $sections = ['Section A', 'Section B', 'Section C'];
        foreach ($sections as $sec) {
            Section::create(['name' => $sec]);
        }
    }
}

