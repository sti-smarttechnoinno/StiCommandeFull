<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Sanitize any orphaned client_id references in orders before adding FK
        $validClientIds = DB::table('clients')->pluck('id');
        DB::table('orders')
            ->whereNotNull('client_id')
            ->whereNotIn('client_id', $validClientIds)
            ->update(['client_id' => null]);

        // 2. Sanitize any orphaned delegate_id references in orders before adding FK
        $validUserIds = DB::table('users')->pluck('id');
        DB::table('orders')
            ->whereNotNull('delegate_id')
            ->whereNotIn('delegate_id', $validUserIds)
            ->update(['delegate_id' => null]);

        // 3. Add foreign keys with ON DELETE SET NULL
        Schema::table('orders', function (Blueprint $table) {
            $table->foreign('client_id')
                ->references('id')
                ->on('clients')
                ->nullOnDelete();

            $table->foreign('delegate_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['client_id']);
            $table->dropForeign(['delegate_id']);
        });
    }
};
