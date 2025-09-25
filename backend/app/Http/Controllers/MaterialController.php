<?php

namespace App\Http\Controllers;

use App\Models\Material;
use App\Models\Notification; // ✅ for notifications
use App\Models\User; // ✅ to target recipients
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

        // ✅ Create notifications for students in the same section
        $teacher = Auth::user();
        $recipients = User::where('role', 'student')
            ->where('section_id', $teacher->section_id) // adjust if section relation is different
            ->get();

        foreach ($recipients as $recipient) {
            Notification::create([
                'user_id' => $recipient->id,
                'type' => 'material',
                'title' => $material->title,
                'message' => "A new {$material->type} has been uploaded by {$teacher->name}.",
                'data' => json_encode([
                    'material_id' => $material->id,
                    'deadline' => $material->deadline,
                ]),
                'is_read' => false,
            ]);
        }

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