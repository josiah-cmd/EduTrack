<?php

namespace App\Http\Controllers;

use App\Models\Section;

class SectionController extends Controller
{
    public function index()
    {
        // Return all sections
        return response()->json(Section::all());
    }
}

