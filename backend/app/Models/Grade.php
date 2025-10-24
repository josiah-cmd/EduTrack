<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Grade extends Model
{
    use HasFactory;

    protected $fillable = [
        'teacher_id',
        'student_id',
        'subject_id',
        'quarter',
        'written_work',
        'performance_task',
        'quarterly_assessment',
        'initial_grade',
        'final_grade',
        'remarks',
        'is_verified',
    ];

    // Relationships
    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }
}