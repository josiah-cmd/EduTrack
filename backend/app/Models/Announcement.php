<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    use HasFactory;

    protected $fillable = ['content', 'created_by', 'target_role'];

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}