<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->foreignId('academic_year_id')
                ->nullable()
                ->after('section_id')
                ->constrained('academic_years')
                ->nullOnDelete();

            $table->boolean('is_archived')->default(false)->after('academic_year_id');
        });
    }

    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropForeign(['academic_year_id']);
            $table->dropColumn(['academic_year_id', 'is_archived']);
        });
    }
};
