<?php

namespace App\Http\Controllers;

use App\Models\AssignmentSubmission;
use Illuminate\Http\Request;

class AssignmentSubmissionController extends Controller
{
    public function store(Request $request) {
        $data = $request->validate([
            'material_id' => 'required|exists:materials,id',    
            'file' => 'required|file|max:10240'
        ]);

        $uploadedFile = $request->file('file');
        $originalName = $uploadedFile->getClientOriginalName();

        // ✅ Store with original name (keeps filename readable)
        $path = $uploadedFile->storeAs(
            'submissions',   // folder
            $originalName,   // keep original filename
            'public'         // disk
        );

        $submission = AssignmentSubmission::create([
            'material_id'   => $data['material_id'],
            'student_id'    => $request->user()->id,
            'file_path'     => $path,          // e.g. submissions/Assignment1.docx
            'filename'      => $originalName,  // e.g. Assignment1.docx
            'submitted_at'  => now(),
        ]);

        return response()->json($submission, 201);
    }

    // 🧑‍🏫 Teacher: list all submissions for a material
    public function index($materialId) {
        return AssignmentSubmission::where('material_id', $materialId)
            ->with('student')
            ->get();
    }

    // 🧑‍🎓 Student: list only their submissions for a material
    public function mySubmissions($materialId, Request $request) {
        $studentId = $request->user()->id;
        return AssignmentSubmission::where('material_id', $materialId)
            ->where('student_id', $studentId)
            ->get();
    }
}