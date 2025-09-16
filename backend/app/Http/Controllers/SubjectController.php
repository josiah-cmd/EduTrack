<?php

namespace App\Http\Controllers;

use App\Models\Subject;

class SubjectController extends Controller
{
    public function index()
    {
        // Return all subjects
        return response()->json(Subject::all());
    }
}
