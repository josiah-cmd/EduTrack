<?php

namespace App\Http\Controllers;

use App\Models\Grade;
use App\Helpers\GradeHelper;
use Illuminate\Http\Request;

class GradeController extends Controller
{
    /**
     * Get all grades for the logged-in teacher
     */
    public function index(Request $request)
    {
        $teacherId = $request->user()->id;

        $grades = Grade::with(['student', 'subject'])
            ->where('teacher_id', $teacherId)
            ->orderBy('subject_id')
            ->get();

        return response()->json($grades);
    }

    /**
     * Store or update a grade record
     */
    public function store(Request $request)
    {
        // ✅ NEW: If request contains multiple students (grades array)
        if ($request->has('grades') && is_array($request->grades)) {
            $validated = $request->validate([
                'quarter' => 'required|string',
                'subject_id' => 'required|exists:subjects,id',
                'grades' => 'required|array',
                'grades.*.student_id' => 'required|exists:users,id',
                'grades.*.written_work' => 'nullable|numeric|min:0|max:100',
                'grades.*.performance_task' => 'nullable|numeric|min:0|max:100',
                'grades.*.quarterly_assessment' => 'nullable|numeric|min:0|max:100',
            ]);

            foreach ($validated['grades'] as $gradeData) {
                $written = (float) ($gradeData['written_work'] ?? 0);
                $performance = (float) ($gradeData['performance_task'] ?? 0);
                $quarterly = (float) ($gradeData['quarterly_assessment'] ?? 0);
                $studentId = $gradeData['student_id'];
                $subjectId = $validated['subject_id'];

                $computed = \App\Helpers\GradeHelper::compute(
                    $written,
                    $performance,
                    $quarterly,
                    $studentId,
                    $subjectId
                );

                \App\Models\Grade::updateOrCreate(
                    [
                        'student_id' => $studentId,
                        'quarter' => $validated['quarter'],
                        'subject_id' => $subjectId,
                    ],
                    array_merge(
                        [
                            'teacher_id' => $request->user()->id,
                            'written_work' => $written,
                            'performance_task' => $performance,
                            'quarterly_assessment' => $quarterly,
                        ],
                        $computed
                    )
                );
            }

            return response()->json(['message' => 'All grades saved successfully.'], 201);
        }

        // 🟡 ORIGINAL CODE STARTS HERE (unchanged)
        $validated = $request->validate([
            'student_id' => 'required|exists:users,id',
            'quarter' => 'required|string',
            'subject_id' => 'nullable|exists:subjects,id',
            'written_work' => 'nullable|numeric|min:0|max:100',
            'performance_task' => 'nullable|numeric|min:0|max:100',
            'quarterly_assessment' => 'nullable|numeric|min:0|max:100',
        ]);

        // ✅ FIX 1: Ensure subject_id always has a safe value
        $subjectId = $validated['subject_id'] ?? 0;

        // Default to 0 if missing
        $written = $validated['written_work'] ?? 0;
        $performance = $validated['performance_task'] ?? 0;
        $quarterly = $validated['quarterly_assessment'] ?? 0;

        // ✅ FIX 2: Force numeric type to avoid null insertion
        $written = (float) $written;
        $performance = (float) $performance;
        $quarterly = (float) $quarterly;

        // Compute using helper (this handles quiz + assignment averages too)
        $computed = GradeHelper::compute(
            $written,
            $performance,
            $quarterly,
            $validated['student_id'],
            $subjectId
        );

        // ✅ FIX 3: Properly use $subjectId instead of null in updateOrCreate
        $grade = Grade::updateOrCreate(
            [
                'student_id' => $validated['student_id'],
                'quarter' => $validated['quarter'],
                'subject_id' => $subjectId,
            ],
            array_merge(
                [
                    'teacher_id' => $request->user()->id,
                    'written_work' => $written,
                    'performance_task' => $performance,
                    'quarterly_assessment' => $quarterly,
                    'subject_id' => $subjectId, // include in update
                ],
                $computed
            )
        );

        return response()->json([
            'message' => 'Grade saved successfully.',
            'grade' => $grade,
        ], 201);
        // 🟡 ORIGINAL CODE ENDS HERE
    }

    /**
     * View all grades for a student
     */
    public function showStudentGrades($studentId)
    {
        $grades = Grade::with('subject')
            ->where('student_id', $studentId)
            ->get();

        return response()->json($grades);
    }

    /**
     * Auto compute grade for a student & quarter
     */
    public function autoCompute($studentId, $quarter)
    {
        // Find the latest grade (optional, not required)
        $grade = Grade::where('student_id', $studentId)
            ->where('quarter', $quarter)
            ->first();

        // Default to 0 if not found
        $written = $grade->written_work ?? 0;
        $performance = $grade->performance_task ?? 0;
        $quarterly = $grade->quarterly_assessment ?? 0;

        // Use GradeHelper for consistent computation
        $computed = \App\Helpers\GradeHelper::compute(
            $written,
            $performance,
            $quarterly,
            $studentId,
            $grade->subject_id ?? null
        );

        return response()->json($computed);
    }

    public function getGrade($studentId, $quarter, Request $request)
    {
        $subjectId = $request->query('subject_id');

        $grade = Grade::where('student_id', $studentId)
            ->where('quarter', $quarter)
            ->when($subjectId, function ($query) use ($subjectId) {
                $query->where('subject_id', $subjectId);
            })
            ->first();

        if (!$grade) {
            return response()->json([
                'message' => 'No grade found.',
                'grade' => null
            ], 200);
        }

        return response()->json([
            'grade' => $grade
        ], 200);
    }

    public function getStudentGrades(Request $request)
    {
        $studentId = auth()->id();
        $quarterParam = $request->query('quarter');

        // 🟩 Map numeric or long names to database format (1st, 2nd, 3rd, 4th)
        $quarterMap = [
            '1' => '1st',
            '2' => '2nd',
            '3' => '3rd',
            '4' => '4th',
            '1st Quarter' => '1st',
            '2nd Quarter' => '2nd',
            '3rd Quarter' => '3rd',
            '4th Quarter' => '4th',
        ];

        $quarter = $quarterMap[$quarterParam] ?? $quarterParam;

        $grades = \App\Models\Grade::with('subject')
            ->where('student_id', $studentId)
            ->when($quarter, function ($query) use ($quarter) {
                $query->where('quarter', $quarter);
            })
            ->get();

        return response()->json([
            'grades' => $grades
        ]);
    }

    public function verify($id)
    {
        $grade = Grade::findOrFail($id);
        $grade->update(['is_verified' => true]);

        return response()->json([
            'message' => 'Grade verified successfully.',
            'grade' => $grade
        ]);
    }

    public function unverify($id)
    {
        $grade = Grade::findOrFail($id);
        $grade->update(['is_verified' => false]);

        return response()->json([
            'message' => 'Grade unverified successfully.',
            'grade' => $grade
        ]);
    }
}