<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobOrder extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'job_order_number',
        'vehicle_id',
        'service_advisor_id',
        'mechanic_id',
        'complaint',
        'diagnosis',
        'repair_action',
        'status',
        'estimated_completion',
        'estimated_cost',
        'actual_cost',
        'discount',
        'payment_status',
        'amount_paid',
        'cancellation_reason',
        'cancelled_at',
    ];

    public function items()
    {
        return $this->hasMany(JobOrderItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function serviceAdvisor()
    {
        return $this->belongsTo(User::class, 'service_advisor_id');
    }

    public function mechanic()
    {
        return $this->belongsTo(User::class, 'mechanic_id');
    }
}
