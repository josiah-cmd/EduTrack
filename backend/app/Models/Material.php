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
        'room_id' // ✅ added so it links to a specific room
    ];

    public function teacher() {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    // 🔹 Room that this material belongs to
    public function room() {
        return $this->belongsTo(Room::class);
    }
}