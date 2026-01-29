<?php

namespace App\Http\Controllers;

use App\Models\Section;
use Illuminate\Http\Request;

class SectionController extends Controller
{
    public function index()
    {
        // Return all sections
        return response()->json(Section::all());
    }

    // ✅ ADDED
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'department' => 'nullable|string|in:JHS,SHS',
            'grade_level' => 'nullable|string|max:50',
            'strand' => 'nullable|string|max:100',
        ]);

        $section = Section::create($validated);

        return response()->json($section, 201);
    }
}