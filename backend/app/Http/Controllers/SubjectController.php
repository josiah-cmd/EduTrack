<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use Illuminate\Http\Request; // ✅ ADDED

class SubjectController extends Controller
{
    public function index()
    {
        // Return all subjects
        return response()->json(Subject::all());
    }

    // ✅ ADDED METHOD (DOES NOT AFFECT EXISTING CODE)
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100|unique:subjects,name',
        ]);

        $subject = Subject::create([
            'name' => $request->name,
        ]);

        return response()->json($subject, 201);
    }
}