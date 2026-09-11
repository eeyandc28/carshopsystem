<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeliveryItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'delivery_id',
        'inventory_id',
        'quantity_received',
        'unit_cost',
        'total_cost',
    ];

    protected $casts = [
        'unit_cost'  => 'decimal:2',
        'total_cost' => 'decimal:2',
    ];

    public function delivery()
    {
        return $this->belongsTo(Delivery::class);
    }

    public function inventory()
    {
        return $this->belongsTo(Inventory::class);
    }
}
