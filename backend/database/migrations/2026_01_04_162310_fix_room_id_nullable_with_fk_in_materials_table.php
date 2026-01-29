<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('materials', function (Blueprint $table) {
            // Drop foreign key first
            $table->dropForeign(['room_id']);
        });

        Schema::table('materials', function (Blueprint $table) {
            // Make room_id nullable
            $table->unsignedBigInteger('room_id')->nullable()->change();
        });

        Schema::table('materials', function (Blueprint $table) {
            // Re-add foreign key
            $table->foreign('room_id')
                  ->references('id')
                  ->on('rooms')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('materials', function (Blueprint $table) {
            $table->dropForeign(['room_id']);
        });

        Schema::table('materials', function (Blueprint $table) {
            $table->unsignedBigInteger('room_id')->nullable(false)->change();
        });

        Schema::table('materials', function (Blueprint $table) {
            $table->foreign('room_id')
                  ->references('id')
                  ->on('rooms')
                  ->onDelete('cascade');
        });
    }
};
