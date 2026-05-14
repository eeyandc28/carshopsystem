<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Inventory extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'part_number',
        'barcode_sku',
        'brand',
        'supplier_id',
        'stock_quantity',
        'reorder_level',
        'unit_price',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }
}
