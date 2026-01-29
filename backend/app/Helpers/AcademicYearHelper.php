<?php

use App\Models\AcademicYear;
use Illuminate\Http\Request;

if (! function_exists('activeAcademicYear')) {
    function activeAcademicYear(): ?AcademicYear
    {
        return AcademicYear::where('is_active', true)->first();
    }
}

/**
 * ✅ Get selected academic year (SESSION-FIRST)
 */
if (! function_exists('selectedAcademicYear')) {
    function selectedAcademicYear(Request $request): ?AcademicYear
    {
        // ✅ API-safe: ALWAYS respect request param
        $academicYearId =
            $request->query('academic_year_id')
            ?? $request->input('academic_year_id');

        if ($academicYearId && is_numeric($academicYearId)) {
            return AcademicYear::find((int) $academicYearId);
        }

        // ✅ Fallback ONLY if frontend didn't send anything
        return AcademicYear::where('is_active', true)->first();
    }
}

if (! function_exists('selectedAcademicYearId')) {
    function selectedAcademicYearId(Request $request): ?int
    {
        $year = selectedAcademicYear($request);
        return $year ? $year->id : null;
    }
}