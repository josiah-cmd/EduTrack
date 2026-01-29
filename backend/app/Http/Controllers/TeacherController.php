<?php

namespace App\Http\Controllers;

use App\Models\Teacher;
use App\Models\Room;
use Illuminate\Http\Request;

class TeacherController extends Controller
{
    public function index()
    {
        $teachers = Teacher::with(
            'user:id,name,email',
            'subject:id,name'
        )
        ->select('id', 'user_id', 'subject_id', 'department')
        ->get();

        return response()->json($teachers);
    }

    public function dashboardStats(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'teacher') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $teacher = $user->teacher;

        if (! $teacher) {
            return response()->json(['message' => 'Teacher profile not found'], 404);
        }

        $academicYear = selectedAcademicYear($request);

        if (! $academicYear) {
            return response()->json(['error' => 'No academic year selected'], 422);
        }

        $academicYearId = $academicYear->id;

        $rooms = Room::with('subject')
            ->where('teacher_id', $teacher->id)
            ->where('academic_year_id', $academicYearId)
            ->where('is_archived', false)
            ->get();

        $uniqueSubjects = $rooms
            ->pluck('subject.name')
            ->filter()
            ->map(fn ($name) => strtoupper(trim(preg_replace('/\d+/', '', $name))))
            ->unique()
            ->count();

        return response()->json([
            'rooms'    => $rooms->count(),
            'sections' => $rooms->pluck('section_id')->unique()->count(),
            'subjects' => $uniqueSubjects,
            'students' => $rooms->sum(fn ($room) => $room->students()->count()),
        ]);
    }
}