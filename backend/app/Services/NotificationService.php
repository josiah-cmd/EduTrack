<?php

namespace App\Services;

use App\Models\Notification;

class NotificationService
{
    /**
     * Create notifications for multiple recipients
     */
    public static function notify($type, $title, $content, $senderId, $recipients, $sectionId = null)
    {
        foreach ((array) $recipients as $recipientId) {
            Notification::create([
                'type' => $type,
                'title' => $title,
                'content' => $content,
                'sender_id' => $senderId,
                'recipient_id' => $recipientId,
                'section_id' => $sectionId,
            ]);
        }
    }
}
