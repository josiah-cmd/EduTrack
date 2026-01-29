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
    // Upload Material (CLASSROOM or TEST BANK)
    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:module,assignment',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file' => 'required|file|mimes:pdf,doc,docx,txt,ppt,pptx,xls,xlsx,mp4,avi,mov,mkv|max:51200',
            'deadline' => 'nullable|date',
            'room_id' => 'nullable|exists:rooms,id',
            'is_test_bank' => 'nullable|boolean',
            'grade_level' => 'nullable|integer|min:7|max:12',
            'material_type' => 'nullable|string',
        ]);

        // 🔒 If NOT test bank, room_id is REQUIRED
        if (!$request->boolean('is_test_bank') && !$request->room_id) {
            return response()->json([
                'error' => 'room_id is required for classroom materials'
            ], 422);
        }

        $uploadedFile = $request->file('file');
        $originalName = $uploadedFile->getClientOriginalName();
        $safeName = time() . '_' . Str::random(6) . '.' . $uploadedFile->getClientOriginalExtension();
        $path = $uploadedFile->storeAs('uploads', $safeName, 'public');

        $isTestBank = $request->boolean('is_test_bank');

        $material = Material::create([
            'teacher_id'   => Auth::id(),
            'type'         => $request->type,
            'title'        => $request->title,
            'description'  => $request->description,
            'file_path'    => $path,
            'original_name'=> $originalName,
            'deadline'     => $request->deadline,

            // ✅ CORRECT: Test Bank materials MUST use NULL for FK safety
            'room_id'      => $isTestBank ? null : $request->room_id,

            'is_test_bank' => $isTestBank,
            'grade_level'  => $request->grade_level,
            'material_type'=> $request->material_type,
        ]);

        // ✅ Notify students ONLY if classroom material
        if (!$material->is_test_bank && $material->room_id) {
            $room = Room::with('students')->find($material->room_id);

            if ($room && $room->students->count() > 0) {
                $recipients = $room->students->pluck('id')->toArray();

                if ($request->type === 'module') {
                    $notifType = 'module';
                    $notifTitle = '[MODULE] ' . $request->title;
                    $notifMessage = 'A new module has been uploaded by ' . Auth::user()->name;
                } else {
                    $notifType = 'assignment';
                    $notifTitle = '[ASSIGNMENT] ' . $request->title;
                    $notifMessage = 'A new assignment has been uploaded by ' . Auth::user()->name;
                }

                NotificationService::notify(
                    $notifType,
                    $notifTitle,
                    $notifMessage,
                    Auth::id(),
                    $recipients,
                    $room->section_id ?? null
                );
            }
        }

        return response()->json([
            'message' => 'Material uploaded successfully!',
            'material' => $material,
            'download_url' => url("/materials/{$material->id}/download")
        ]);
    }

    // List Materials (CLASSROOM ONLY)
    public function index(Request $request)
    {
        $type = $request->query('type');
        $roomId = $request->query('room_id');

        $materials = Material::query()
            ->where('is_test_bank', false)
            ->when($type, fn($q) => $q->where('type', $type))
            ->when($roomId, fn($q) => $q->where('room_id', $roomId))
            ->with('teacher:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($materials);
    }

    // List TEST BANK Materials
    public function testBank(Request $request)
    {
        $materials = Material::query()
            ->where('is_test_bank', true)
            ->where('teacher_id', Auth::id())
            ->when($request->grade_level, fn($q) => $q->where('grade_level', $request->grade_level))
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($materials);
    }

    // Download Material
    public function download($id)
    {
        $material = Material::findOrFail($id);
        $filePath = Storage::disk('public')->path($material->file_path);

        if (!file_exists($filePath)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        $fileName = $material->original_name;
        if (!pathinfo($fileName, PATHINFO_EXTENSION)) {
            $fileName .= '.' . pathinfo($filePath, PATHINFO_EXTENSION);
        }

        return response()->download($filePath, $fileName, [
            'Content-Type' => mime_content_type($filePath),
        ]);
    }

    // Preview Material
    public function preview($id)
    {
        $material = Material::findOrFail($id);
        $filePath = Storage::disk('public')->path($material->file_path);

        if (!file_exists($filePath)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mime = mime_content_type($filePath);

        if (in_array($extension, ['pdf', 'mp4', 'mov', 'avi', 'mkv'])) {
            return response()->file($filePath, [
                'Content-Type' => $mime,
                'Content-Disposition' => 'inline; filename="' . ($material->original_name ?? $material->title . '.' . $extension) . '"',
            ]);
        }

        return response()->download($filePath);
    }

    // Update Material
    public function update(Request $request, $id)
    {
        $material = Material::findOrFail($id);

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file' => 'nullable|file|mimes:pdf,doc,docx,txt,ppt,pptx,xls,xlsx,mp4,avi,mov,mkv|max:51200',
        ]);

        $material->title = $request->title;
        $material->description = $request->description;

        if ($request->hasFile('file')) {
            Storage::disk('public')->delete($material->file_path);

            $uploadedFile = $request->file('file');
            $originalName = $uploadedFile->getClientOriginalName();
            $safeName = time() . '_' . Str::random(6) . '.' . $uploadedFile->getClientOriginalExtension();
            $path = $uploadedFile->storeAs('uploads', $safeName, 'public');

            $material->file_path = $path;
            $material->original_name = $originalName;
        }

        $material->save();

        return response()->json([
            'message' => 'Material updated successfully!',
            'material' => $material
        ]);
    }

    // Delete Material
    public function destroy($id)
    {
        $material = Material::findOrFail($id);

        Storage::disk('public')->delete($material->file_path);
        $material->delete();

        return response()->json([
            'message' => 'Material deleted successfully!'
        ]);
    }

    // Attach Material From Test Bank to Room
    public function attachFromTestBank(Request $request)
    {
        $validated = $request->validate([
            'material_id' => 'required|exists:materials,id',
            'room_id' => 'required|exists:rooms,id',
        ]);

        $material = Material::where('id', $validated['material_id'])
            ->where('is_test_bank', true)
            ->where('teacher_id', Auth::id())
            ->firstOrFail();

        // ✅ Duplicate material
        $newMaterial = $material->replicate();

        // ✅ REQUIRED: explicitly re-bind ownership & context
        $newMaterial->teacher_id = Auth::id();
        $newMaterial->room_id = $validated['room_id'];
        $newMaterial->is_test_bank = false;

        // ✅ Ensure timestamps are fresh
        $newMaterial->created_at = now();
        $newMaterial->updated_at = now();

        $newMaterial->save();

        return response()->json([
            'message' => 'Material added to room from test bank successfully',
            'material' => $newMaterial
        ]);
    }
}