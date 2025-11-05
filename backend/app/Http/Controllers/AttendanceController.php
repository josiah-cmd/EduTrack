<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function index()
    {
        return response()->json(
        Attendance::with([
            'student:id,name,lrn',
            'subject:id,subject_name'
        ])->get()
    );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'student_id' => 'required|exists:users,id',
            'subject_id' => 'nullable|exists:subjects,id',
            'date' => 'required|date',
            'status' => 'required|in:present,absent,late',
            'notes' => 'nullable|string',
        ]);

        $attendance = Attendance::updateOrCreate(
            [
                'student_id' => $data['student_id'],
                'subject_id' => $data['subject_id'],
                'date' => $data['date'],
            ],
            [
                'status' => $data['status'],
                'notes' => $data['notes'] ?? null,
            ]
        );

        return response()->json($attendance, 201);
    }
}