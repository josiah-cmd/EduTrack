<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

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

    /* ------------------- ACADEMIC YEAR ------------------- */
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

        return response()->json(['message' => 'Academic year updated successfully', 'data' => $setting]);
    }

    /* ------------------- GRADING SYSTEM ------------------- */
    public function getGradingSystem()
    {
        $settings = Setting::whereIn('key', ['passing_grade', 'excellent_range', 'good_range', 'needs_improvement_range'])->get();
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
}