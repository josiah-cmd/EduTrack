<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->string('grade_level')->nullable()->after('role'); // ✅ Grade 7 - 12
            $table->foreignId('section_id')->nullable()->constrained('sections')->onDelete('set null'); // ✅ Section relation
        });
    }

    public function down(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('grade_level');
            $table->dropConstrainedForeignId('section_id');
        });
    }
};