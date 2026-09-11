<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys=OFF;');
            
            $row = DB::selectOne("SELECT sql FROM sqlite_master WHERE type='table' AND name='job_orders'");
            if ($row && isset($row->sql)) {
                $sql = $row->sql;
                
                if (str_contains($sql, "'released'") && !str_contains($sql, "'cancelled'")) {
                    $newSql = str_replace("'released'", "'released', 'cancelled'", $sql);
                    
                    DB::statement('CREATE TABLE job_orders_backup AS SELECT * FROM job_orders;');
                    DB::statement('DROP TABLE job_orders;');
                    DB::statement($newSql);
                    DB::statement('INSERT INTO job_orders SELECT * FROM job_orders_backup;');
                    DB::statement('DROP TABLE job_orders_backup;');
                }
            }
            
            DB::statement('PRAGMA foreign_keys=ON;');
        }
    }

    public function down(): void
    {
    }
};
