    <?php

    use Illuminate\Database\Migrations\Migration;
    use Illuminate\Database\Schema\Blueprint;
    use Illuminate\Support\Facades\Schema;

    return new class extends Migration
    {
        public function up(): void
        {
            Schema::create('announcements', function (Blueprint $table) {
                $table->id();
                $table->text('content');
                $table->unsignedBigInteger('created_by'); // admin/staff
                $table->timestamps();
                $table->string('target_role')->default('all');

                $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            });
        }

        public function down(): void
        {
            Schema::dropIfExists('announcements');
        }
    };
