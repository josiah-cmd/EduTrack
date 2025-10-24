<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('rooms', function (Blueprint $table) {
            // 🟢 Add new JSON column to store day/time pairs (schedule)
            $table->json('schedule')->nullable()->after('day');
        });
    }

    public function down(): void {
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn('schedule');
        });
    }
};