<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'job_order_id',
        'amount',
        'discount',
        'payment_method',
        'reference_number',
        'payment_date',
    ];

    public function jobOrder()
    {
        return $this->belongsTo(JobOrder::class);
    }
}
