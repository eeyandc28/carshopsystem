<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_order_id',
        'inventory_id',
        'item_type',
        'description',
        'quantity',
        'unit_price',
        'total_price',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    public function jobOrder()
    {
        return $this->belongsTo(JobOrder::class);
    }

    public function inventory()
    {
        return $this->belongsTo(Inventory::class);
    }
}
