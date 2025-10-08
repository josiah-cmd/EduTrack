<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quiz extends Model
{
    use HasFactory;

    protected $fillable = [
        'teacher_id',
        'room_id',           // ✅ changed from section_id (to match migration)
        'title',
        'instructions',
        'start_time',
        'end_time',
        'duration',          // ✅ changed from time_limit (to match migration)
        'passing_score',
        'total_points',
        'status',
    ];

    public function questions()
    {
        return $this->hasMany(Question::class);
    }

    public function results()
    {
        return $this->hasMany(QuizResult::class);
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }
}