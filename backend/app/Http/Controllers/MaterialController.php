<?php

namespace App\Http\Controllers;

use App\Models\Material;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class MaterialController extends Controller
{
    // Upload
    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:module,assignment',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file' => 'required|mimes:pdf,doc,docx,txt,ppt,pptx,xls,xlsx|max:20480',
            'deadline' => 'nullable|date'
        ]);

        $path = $request->file('file')->store('uploads', 'public');

        $material = Material::create([
            'teacher_id' => Auth::id(),
            'type' => $request->type,
            'title' => $request->title,
            'description' => $request->description,
            'file_path' => $path,
            'deadline' => $request->deadline
        ]);

        return response()->json(['message' => 'Material uploaded successfully!', 'material' => $material]);
    }

    // List materials
    public function index(Request $request)
    {
        $type = $request->query('type'); 
        $materials = Material::when($type, fn($q) => $q->where('type', $type))
            ->with('teacher:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($materials);
    }

    // Force Download
    public function download($id)
    {
        $material = Material::findOrFail($id);
        return Storage::disk('public')->download($material->file_path);
    }

    // Preview Inline
    public function preview($id)
    {
        $material = Material::findOrFail($id);
        $path = Storage::disk('public')->path($material->file_path);

        return response()->file($path);
    }
}