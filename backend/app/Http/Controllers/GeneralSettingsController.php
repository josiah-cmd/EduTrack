<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use App\Models\AcademicYear;
use App\Models\Room;
use Carbon\Carbon;

class GeneralSettingsController extends Controller
{
    /* ------------------- SCHOOL INFORMATION ------------------- */
    public function getSchoolInfo()
    {
        $settings = Setting::whereIn('key', ['school_name', 'school_address', 'school_logo'])->get();
        return response()->json($settings);
    }

    public function updateSchoolInfo(Request $request)
    {
        $data = $request->validate([
            'school_name' => 'nullable|string',
            'school_address' => 'nullable|string',
            'school_logo' => 'nullable|string',
        ]);

        foreach ($data as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        return response()->json(['message' => 'School info updated successfully']);
    }

    /* ------------------- ACADEMIC YEAR (LEGACY SETTING) ------------------- */
    public function getAcademicYear()
    {
        $setting = Setting::where('key', 'academic_year')->first();
        return response()->json($setting);
    }

    public function updateAcademicYear(Request $request)
    {
        $data = $request->validate([
            'academic_year' => 'required|string',
        ]);

        $setting = Setting::updateOrCreate(
            ['key' => 'academic_year'],
            ['value' => $data['academic_year']]
        );

        return response()->json([
            'message' => 'Academic year updated successfully',
            'data' => $setting
        ]);
    }

    /* ------------------- GRADING SYSTEM ------------------- */
    public function getGradingSystem()
    {
        $settings = Setting::whereIn('key', [
            'passing_grade',
            'excellent_range',
            'good_range',
            'needs_improvement_range'
        ])->get();

        return response()->json($settings);
    }

    public function updateGradingSystem(Request $request)
    {
        $data = $request->validate([
            'passing_grade' => 'nullable|string',
            'excellent_range' => 'nullable|string',
            'good_range' => 'nullable|string',
            'needs_improvement_range' => 'nullable|string',
        ]);

        foreach ($data as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        return response()->json(['message' => 'Grading system updated successfully']);
    }

    /* ------------------- ACADEMIC YEAR (SYSTEM) ------------------- */
    public function createAcademicYear(Request $request)
    {
        $data = $request->validate([
            'year_label' => 'required|string|unique:academic_years,year_label',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after:start_date',
        ]);

        AcademicYear::where('is_active', true)->update(['is_active' => false]);

        $academicYear = AcademicYear::create([
            'year_label' => $data['year_label'],
            'start_date' => $data['start_date'],
            'end_date'   => $data['end_date'],
            'is_active'  => true,
        ]);

        return response()->json([
            'message' => 'Academic year created and activated',
            'data' => $academicYear
        ]);
    }

    public function activeAcademicYear()
    {
        $year = AcademicYear::where('is_active', true)->first();
        return response()->json($year);
    }

    /* ===================== ADDED METHODS ===================== */

    public function listAcademicYears()
    {
        $years = AcademicYear::orderBy('start_date', 'desc')->get();
        return response()->json($years);
    }

    public function activateAcademicYear($id)
    {
        // Archive rooms of the currently active year
        $previousYear = AcademicYear::where('is_active', true)->first();

        if ($previousYear) {
            $previousYear->update(['is_active' => false]);
        }

        // Activate selected academic year
        $year = AcademicYear::findOrFail($id);
        $year->update(['is_active' => true]);

        // 🔴 IMPORTANT FIX: Unarchive rooms for the activated year
        Room::where('academic_year_id', $year->id)
            ->update(['is_archived' => false]);

        return response()->json([
            'message' => 'Academic year activated successfully',
            'data' => $year
        ]);
    }
}