<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'invoice_number',
        'job_order_id',
        'total_labor',
        'total_parts',
        'tax_amount',
        'discount_amount',
        'grand_total',
        'status',
    ];

    public function jobOrder()
    {
        return $this->belongsTo(JobOrder::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
