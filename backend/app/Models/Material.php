<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Material extends Model
{
    use HasFactory;

    protected $fillable = [
        'teacher_id',
        'type',
        'title',
        'description',
        'file_path',
        'deadline',
        'original_name',
        'room_id',           // ✅ existing – classroom materials
        'is_test_bank',      // ✅ ADDED – identifies test bank items
        'grade_level',       // ✅ ADDED – grade 7–12 filtering
        'material_type',     // ✅ ADDED – quiz, question, module, etc.
    ];

    // 🔹 Teacher who owns the material (USED BY BOTH CLASS & TEST BANK)
    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    // 🔹 Room that this material belongs to (NULL if test bank)
    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    /* ===========================
       TEST BANK SCOPES (ADDED)
       =========================== */

    // 🔹 Only test bank materials
    public function scopeTestBank($query)
    {
        return $query->where('is_test_bank', true);
    }

    // 🔹 Only classroom materials
    public function scopeClassroom($query)
    {
        return $query->where('is_test_bank', false);
    }

    // 🔹 Filter by grade level (7–12)
    public function scopeForGrade($query, $grade)
    {
        return $query->where('grade_level', $grade);
    }
}