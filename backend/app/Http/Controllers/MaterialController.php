<?php

namespace App\Http\Controllers;

use App\Models\Material;
use App\Models\User;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Services\NotificationService;
use Illuminate\Support\Str;

class MaterialController extends Controller
{
    // Upload Material
    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:module,assignment',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file' => 'required|file|mimes:pdf,doc,docx,txt,ppt,pptx,xls,xlsx,mp4,avi,mov,mkv|max:51200',
            'deadline' => 'nullable|date',
            'room_id' => 'required|exists:rooms,id'
        ]);

        $uploadedFile = $request->file('file');
        $originalName = $uploadedFile->getClientOriginalName();
        $safeName = time() . '_' . \Illuminate\Support\Str::random(6) . '.' . $uploadedFile->getClientOriginalExtension();
        $path = $uploadedFile->storeAs('uploads', $safeName, 'public');

        $material = \App\Models\Material::create([
            'teacher_id' => \Illuminate\Support\Facades\Auth::id(),
            'type' => $request->type,
            'title' => $request->title,
            'description' => $request->description,
            'file_path' => $path,
            'original_name' => $originalName,
            'deadline' => $request->deadline,
            'room_id' => $request->room_id,
        ]);

        // ✅ Notify students who joined the room only
        $room = \App\Models\Room::with('students')->find($request->room_id);

        if ($room && $room->students->count() > 0) {
            $recipients = $room->students->pluck('id')->toArray();

            if ($request->type === 'module') {
                $notifType = 'module';
                $notifTitle = '[MODULE] ' . $request->title;
                $notifMessage = 'A new module been uploaded by ' . \Illuminate\Support\Facades\Auth::user()->name;
            } else {
                $notifType = 'assignment';
                $notifTitle = '[ASSIGNMENT] ' . $request->title;
                $notifMessage = 'A new assignment been uploaded by ' . \Illuminate\Support\Facades\Auth::user()->name;
            }

            \App\Services\NotificationService::notify(
                $notifType,
                $notifTitle,
                $notifMessage,
                \Illuminate\Support\Facades\Auth::id(),
                $recipients,
                $room->section_id ?? null
            );
        }

        return response()->json([
            'message' => 'Material uploaded successfully!',
            'material' => $material,
            'download_url' => url("/materials/{$material->id}/download")
        ]);
    }

    // List Materials
    public function index(Request $request)
    {
        $type = $request->query('type');
        $roomId = $request->query('room_id');

        $materials = Material::query()
            ->when($type, fn($q) => $q->where('type', $type))
            ->when($roomId, fn($q) => $q->where('room_id', $roomId))
            ->with('teacher:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($materials);
    }

    // Download Material (always returns correct file)
    public function download($id)
    {
        $material = Material::findOrFail($id);
        $filePath = Storage::disk('public')->path($material->file_path);

        if (!file_exists($filePath)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        // ✅ FIX: Ensure proper filename with extension
        $fileName = $material->original_name;
        if (!pathinfo($fileName, PATHINFO_EXTENSION)) {
            $fileName .= '.' . pathinfo($filePath, PATHINFO_EXTENSION);
        }

        // ✅ Send file with correct headers
        return response()->download($filePath, $fileName, [
            'Content-Type' => mime_content_type($filePath),
        ]);
    }

    // Preview PDF Inline
    public function preview($id)
    {
        $material = Material::findOrFail($id);
        $filePath = Storage::disk('public')->path($material->file_path);

        if (!file_exists($filePath)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mime = mime_content_type($filePath);

        // ✅ Allow inline viewing for PDF or video (mp4, mov, avi, mkv)
        if (in_array($extension, ['pdf', 'mp4', 'mov', 'avi', 'mkv'])) {
            return response()->file($filePath, [
                'Content-Type' => $mime,
                'Content-Disposition' => 'inline; filename="' . ($material->original_name ?? $material->title . '.' . $extension) . '"',
            ]);
        }

        // Other files → force download
        $fileName = $material->original_name ?? ($material->title . '.' . $extension);
        return response()->download($filePath, $fileName);
    }
}
