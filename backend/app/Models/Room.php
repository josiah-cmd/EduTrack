<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use App\Models\AcademicYear;

class Room extends Model {
    use HasFactory;

    protected $fillable = [
        'subject_id',
        'teacher_id',
        'section_id',
        'day',
        'time',
        'created_by',
        'token',
        'academic_year_id',
        'is_archived',
    ];

    protected $casts = [
        'day' => 'array',
        'is_archived' => 'boolean',
    ];

    /* ===================== ADDED GLOBAL SCOPE ===================== */

    protected static function booted()
    {
        static::addGlobalScope('activeAcademicYear', function (Builder $builder) {
            $year = AcademicYear::where('is_active', true)->first();

            if ($year) {
                $builder
                    ->where('academic_year_id', $year->id)
                    ->where('is_archived', false);
            }
        });
    }

    /* ---------------- RELATIONSHIPS ---------------- */

    public function subject() {
        return $this->belongsTo(Subject::class);
    }

    public function teacher() {
        return $this->belongsTo(Teacher::class);
    }

    public function section() {
        return $this->belongsTo(Section::class);
    }

    public function creator() {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function students() {
        return $this->belongsToMany(User::class, 'room_user', 'room_id', 'user_id')
            ->where('role', 'student');
    }

    public function materials() {
        return $this->hasMany(Material::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    /* ---------------- STATE ---------------- */

    public function isReadOnly(): bool
    {
        return $this->is_archived || ! $this->academicYear?->is_active;
    }
}