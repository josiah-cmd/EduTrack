<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            // Step 1: Add new JSON column
            $table->json('day_json')->nullable()->after('section_id');
        });

        // Step 2: Convert existing text day values into valid JSON
        DB::statement('UPDATE rooms SET day_json = JSON_QUOTE(day)');

        Schema::table('rooms', function (Blueprint $table) {
            // Step 3: Drop old column and rename new one
            $table->dropColumn('day');
            $table->renameColumn('day_json', 'day');
        });
    }

    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            // Revert to string column if rolled back
            $table->string('day')->change();
        });
    }
};