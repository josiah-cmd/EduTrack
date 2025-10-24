<?php

namespace App\Helpers;

use App\Models\QuizResult;
use App\Models\AssignmentSubmission;
use App\Models\Subject; // 🆕 ADDED

class GradeHelper
{
    public static function compute($written, $performance, $quarterly, $studentId = null, $subjectId = null, $quarter = null)
    {
        if ($studentId && $subjectId) {
            // 🟢 Get quiz average for all rooms under this subject
            $quizQuery = QuizResult::where('student_id', $studentId)
                ->whereHas('quiz.room', function ($q) use ($subjectId) {
                    $q->where('subject_id', $subjectId);
                });

            if ($quarter) {
                $quizQuery->where('quarter', $quarter);
            }

            $quizAvg = $quizQuery->avg('score');
            if ($quizAvg !== null) {
                $written = $quizAvg;
            }

            // 🟢 Get performance task (assignment) average
            $activityQuery = AssignmentSubmission::where('student_id', $studentId)
                ->whereHas('material', function ($q) use ($subjectId) {
                    $q->where('subject_id', $subjectId);
                });

            if ($quarter) {
                $activityQuery->where('quarter', $quarter);
            }

            // Temporarily disabled because no score column yet
            $activityAvg = 0;

            if ($activityAvg) $performance = $activityAvg;
        }

        $written = $written ?? 0;
        $performance = $performance ?? 0;
        $quarterly = $quarterly ?? 0;

        // 🆕 ADDED — DWAD GRADE COMPUTATION WEIGHTS (Reference Sheet)
        $weights = [
            // Junior High
            'GRADE7' => ['written' => 0.30, 'performance' => 0.50, 'quarterly' => 0.20],
            'GRADE8' => ['written' => 0.30, 'performance' => 0.50, 'quarterly' => 0.20],
            'GRADE9' => ['written' => 0.30, 'performance' => 0.50, 'quarterly' => 0.20],
            'GRADE10' => ['written' => 0.30, 'performance' => 0.50, 'quarterly' => 0.20],

            // Senior High (Academic Track)
            'SHS AT - ACADEMIC TRACK' => ['written' => 0.25, 'performance' => 0.45, 'quarterly' => 0.30],

            // Senior High (TVL Track)
            'SHS TVL - TECH-VOC-LIVELIHOOD' => ['written' => 0.20, 'performance' => 0.60, 'quarterly' => 0.20],

            // Default
            'DEFAULT' => ['written' => 0.25, 'performance' => 0.50, 'quarterly' => 0.25],
        ];

        // 🆕 Identify subject type from database
        $subjectType = 'DEFAULT';
        if ($subjectId) {
            $subject = Subject::find($subjectId);
            if ($subject) {
                $name = strtoupper(trim($subject->name));

                if (str_contains($name, 'GRADE 7')) $subjectType = 'GRADE7';
                elseif (str_contains($name, 'GRADE 8')) $subjectType = 'GRADE8';
                elseif (str_contains($name, 'GRADE 9')) $subjectType = 'GRADE9';
                elseif (str_contains($name, 'GRADE 10')) $subjectType = 'GRADE10';
                elseif (str_contains($name, 'SHS') && str_contains($name, 'ACADEMIC')) $subjectType = 'SHS AT - ACADEMIC TRACK';
                elseif (str_contains($name, 'SHS') && str_contains($name, 'TVL')) $subjectType = 'SHS TVL - TECH-VOC-LIVELIHOOD';
            }
        }

        $w = $weights[$subjectType]['written'];
        $p = $weights[$subjectType]['performance'];
        $q = $weights[$subjectType]['quarterly'];

        // 🆕 Apply dynamic weights
        $initial = ($written * $w) + ($performance * $p) + ($quarterly * $q);
        $final = $initial;
        $remarks = $final >= 75 ? 'Passed' : 'Failed';

        return [
            'initial_grade' => round($initial, 2),
            'final_grade' => round($final, 2),
            'remarks' => $remarks,
        ];
    }
}