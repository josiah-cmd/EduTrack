<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\AcademicYear;
use App\Models\Room;

class ArchiveAcademicYears extends Command
{
    protected $signature = 'academic-year:archive';
    protected $description = 'Archive rooms when academic year ends';

    public function handle()
    {
        $years = AcademicYear::where('is_active', true)
            ->where('end_date', '<', now())
            ->get();

        foreach ($years as $year) {
            $year->update(['is_active' => false]);

            Room::where('academic_year_id', $year->id)
                ->update(['is_archived' => true]);
        }

        $this->info('Academic years archived successfully.');
    }
}