<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Grade;
use App\Models\User;
use App\Models\Subject;
use App\Models\QuizResult;
use App\Models\AssignmentSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportsController extends Controller
{
    /**
     * Student performance aggregated report.
     * Query parameters (optional):
     * - student_id (required for student-level)
     * - subject_id (optional to filter by subject)
     * - date_from, date_to (optional)
     *
     * Response: JSON with aggregated averages and per-subject breakdown.
     */
    public function studentPerformance(Request $request)
    {
        $request->validate([
            'student_id' => 'nullable|integer|exists:users,id',
            'subject_id' => 'nullable|integer|exists:subjects,id',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
        ]);

        $studentId = $request->input('student_id');
        $subjectId = $request->input('subject_id');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $grades = Grade::query()
            ->with(['student:id,name', 'subject:id,name'])
            ->when($studentId, fn($q) => $q->where('student_id', $studentId))
            ->when($subjectId, fn($q) => $q->where('subject_id', $subjectId))
            ->when($dateFrom, fn($q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo, fn($q) => $q->whereDate('created_at', '<=', $dateTo))
            ->get();

        if ($grades->isEmpty()) {
            return response()->json([
                'success' => true,
                'data' => [],
                'message' => 'No performance data available.',
            ]);
        }

        // Group by student and subject
        $report = $grades->groupBy(['student_id', 'subject_id'])->map(function ($subjectGroup, $studentId) {
            $student = $subjectGroup->first()->first()->student;
            return [
                'student_id' => $studentId,
                'student_name' => $student->name ?? 'Unknown',
                'subjects' => $subjectGroup->map(function ($records, $subjectId) {
                    $subject = $records->first()->subject;
                    $initialAvg = round($records->avg('initial_grade'), 2);
                    $finalAvg = round($records->avg('final_grade'), 2);
                    return [
                        'subject_id' => $subjectId,
                        'subject_name' => $subject->name ?? 'Subject',
                        'average' => $initialAvg,
                        'grade' => $finalAvg,
                        'remarks' => $records->first()->remarks ?? '-',
                        'is_verified' => $records->first()->is_verified ?? 0,
                    ];
                })->values(),
            ];
        })->values();

        // ✅ Flatten for frontend compatibility
        $flatReport = [];
        foreach ($report as $student) {
            foreach ($student['subjects'] as $subject) {
                $flatReport[] = [
                    'student_id' => $student['student_id'],
                    'student_name' => $student['student_name'],
                    'subject_id' => $subject['subject_id'],
                    'subject_name' => $subject['subject_name'],
                    'average_score' => $subject['average'],
                    'grade' => $subject['grade'],
                    'remarks' => $subject['remarks'],
                    'is_verified' => $subject['is_verified'] ?? 0,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => $flatReport,
        ]);
    }

    /**
     * Attendance report.
     * Params:
     * - student_id (optional)
     * - subject_id (optional)
     * - date_from, date_to (optional)
     *
     * Response:
     * - total_records, present_count, absent_count, late_count, percentages and daily list
     */
       // ✅ Attendance Report Function
    public function attendanceReport(Request $request)
    {
        $request->validate([
            'subject_id' => 'nullable|integer|exists:subjects,id',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
        ]);

        $query = \App\Models\Attendance::with(['student:id,name', 'subject:id,name'])
            ->when($request->subject_id, fn($q) => $q->where('subject_id', $request->subject_id))
            ->when($request->date_from, fn($q) => $q->whereDate('date', '>=', $request->date_from))
            ->when($request->date_to, fn($q) => $q->whereDate('date', '<=', $request->date_to));

        $records = $query->get();

        if ($records->isEmpty()) {
            return response()->json([
                'success' => true,
                'data' => ['records' => []],
                'message' => 'No attendance data available.',
            ]);
        }

        // Group by student and subject for aggregation
        $grouped = $records->groupBy(['student_id', 'subject_id'])->map(function ($subjectGroup, $studentId) {
            $student = $subjectGroup->first()->first()->student;
            return [
                'student_id' => $studentId,
                'student_name' => $student->name ?? 'Unknown',
                'subjects' => $subjectGroup->map(function ($records, $subjectId) {
                    $subject = $records->first()->subject;
                    $present = $records->where('status', 'present')->count();
                    $absent = $records->where('status', 'absent')->count();
                    $late = $records->where('status', 'late')->count();

                    return [
                        'subject_id' => $subjectId,
                        'subject_name' => $subject->name ?? 'N/A',
                        'present_days' => $present,
                        'absent_days' => $absent,
                        'late_days' => $late,
                    ];
                })->values(),
            ];
        })->values();

        // Flatten for frontend
        $flatReport = [];
        foreach ($grouped as $student) {
            foreach ($student['subjects'] as $subject) {
                $flatReport[] = [
                    'student_name' => $student['student_name'],
                    'subject_name' => $subject['subject_name'],
                    'present_days' => $subject['present_days'],
                    'absent_days' => $subject['absent_days'],
                    'late_days' => $subject['late_days'],
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'records' => $flatReport,
            ],
        ]);
    }

    public function storeAttendance(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:users,id',
            'subject_id' => 'required|exists:subjects,id',
            'date' => 'required|date',
            'status' => 'required|in:present,absent,late',
            'notes' => 'nullable|string',
        ]);

        $attendance = \App\Models\Attendance::updateOrCreate(
            [
                'student_id' => $validated['student_id'],
                'subject_id' => $validated['subject_id'],
                'date' => $validated['date'],
            ],
            [
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Attendance saved successfully!',
            'data' => $attendance
        ], 201);
    }

    public function subjectCompletionRates(Request $request)
    {
        $subjects = Subject::all();
        $report = [];

        foreach ($subjects as $subject) {
            $studentsWithGrades = Grade::where('subject_id', $subject->id)
                ->where('is_verified', true)
                ->select('student_id')
                ->distinct()
                ->get()
                ->pluck('student_id');

            $completedCount = 0;

            foreach ($studentsWithGrades as $studentId) {
                $quarters = Grade::where('subject_id', $subject->id)
                    ->where('student_id', $studentId)
                    ->where('is_verified', true)
                    ->pluck('quarter')
                    ->unique()
                    ->count();

                if ($quarters >= 4) {
                    $completedCount++;
                }
            }

            $totalStudents = $studentsWithGrades->count();
            $completionRate = $totalStudents > 0
                ? round(($completedCount / $totalStudents) * 100, 2)
                : 0;

            $report[] = [
                'subject_id' => $subject->id,
                'subject_name' => $subject->name,
                'total_students' => $totalStudents,
                'completed_students' => $completedCount,
                'completion_rate' => $completionRate,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $report,
        ]);
    }
} // ✅ Close class
