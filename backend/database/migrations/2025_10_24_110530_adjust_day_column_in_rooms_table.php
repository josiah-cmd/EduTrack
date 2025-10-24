<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('rooms', function (Blueprint $table) {
            // Change "day" column to store multiple days as JSON
            $table->json('day')->nullable()->change();
        });
    }

    public function down(): void {
        Schema::table('rooms', function (Blueprint $table) {
            // Revert to string if rolled back
            $table->string('day')->change();
        });
    }
};