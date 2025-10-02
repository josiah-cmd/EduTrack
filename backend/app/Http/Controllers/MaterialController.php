<?php

namespace App\Http\Controllers;

use App\Models\Material;
use App\Models\User; // ✅ to target recipients
use App\Models\Room; // ✅ to fetch room info
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Services\NotificationService; // ✅ use the same service

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
            'deadline' => 'nullable|date',
            'room_id' => 'required|exists:rooms,id' // ✅ ensure material belongs to a room
        ]);

        $path = $request->file('file')->store('uploads', 'public');

        $material = Material::create([
            'teacher_id' => Auth::id(),
            'type' => $request->type,
            'title' => $request->title,
            'description' => $request->description,
            'file_path' => $path,
            'deadline' => $request->deadline,
            'room_id' => $request->room_id // ✅ link material to specific room
        ]);

        // ✅ Create notifications for students in the same room
        $teacher = Auth::user();
        $room = Room::with('students')->findOrFail($request->room_id); // assumes Room has students() relation

        $recipients = $room->students->pluck('id')->toArray(); // ✅ all students in this room only

        NotificationService::notify(
            'material',
            $material->title,
            "A new {$material->type} has been uploaded by {$teacher->name}.",
            $teacher->id,
            $recipients,
            $room->section_id // ✅ use room's section
        );

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