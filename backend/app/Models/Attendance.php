<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'subject_id',
        'date',
        'status',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    // relationships
    public function student()
    {
        return $this->belongsTo(\App\Models\User::class, 'student_id');
    }

    public function subject()
    {
        return $this->belongsTo(\App\Models\Subject::class, 'subject_id');
    }
}