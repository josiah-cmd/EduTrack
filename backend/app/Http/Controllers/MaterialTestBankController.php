<?php

namespace App\Http\Controllers;

use App\Models\Material;
use Illuminate\Http\Request;

class MaterialTestBankController extends Controller
{
    public function index()
    {
        return Material::where('teacher_id', auth()->user()->teacher->id)
            ->where('is_test_bank', true)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'file' => 'required|file|mimes:pdf,doc,docx,ppt,pptx',
            'grade_level' => 'nullable|integer|min:7|max:12',
            'material_type' => 'nullable|string',
        ]);

        $path = $request->file('file')->store('materials');

        $material = Material::create([
            'teacher_id' => auth()->user()->teacher->id,
            'title' => $validated['title'],
            'file_path' => $path,
            'original_name' => $request->file('file')->getClientOriginalName(),
            'is_test_bank' => true,
            'grade_level' => $validated['grade_level'] ?? null,
            'material_type' => $validated['material_type'] ?? 'module',
        ]);

        return response()->json($material, 201);
    }
}