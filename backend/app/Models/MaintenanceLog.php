<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class MaintenanceLog extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'vehicle_id',
        'log_type',
        'details',
        'mileage_at_log',
        'log_date',
        'next_due_date',
        'next_due_mileage',
    ];

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }
}
