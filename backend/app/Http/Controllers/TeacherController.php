<?php

namespace App\Http\Controllers;

use App\Models\Teacher;

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
}