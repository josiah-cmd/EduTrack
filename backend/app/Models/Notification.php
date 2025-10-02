<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'title',
        'content',
        'sender_id',
        'recipient_id',
        'section_id',
        'read_at',
    ];

    protected $appends = ['sender_name']; // ✅ Auto include in JSON

    // relationships
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function recipient()
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    // ✅ Computed attribute for sender_name
    public function getSenderNameAttribute()
    {
        return $this->sender ? $this->sender->name : null;
    }
}