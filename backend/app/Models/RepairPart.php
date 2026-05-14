<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class RepairPart extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'repair_id',
        'inventory_id',
        'quantity',
        'unit_price',
        'subtotal',
    ];

    public function repair()
    {
        return $this->belongsTo(Repair::class);
    }

    public function inventory()
    {
        return $this->belongsTo(Inventory::class);
    }
}
