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
        'type',
        'keyword',
        'part_number',
        'barcode_sku',
        'brand',
        'supplier_id',
        'stock_quantity',
        'reorder_level',
        'unit_price',
        'markup_rate',
    ];

    protected $casts = [
        'unit_price'  => 'decimal:2',
        'markup_rate' => 'decimal:2',
    ];

    protected $appends = [
        'selling_price',
    ];

    public function getSellingPriceAttribute()
    {
        $cost = (float) ($this->unit_price ?? 0);
        $markup = (float) ($this->markup_rate ?? 0);
        return round($cost * (1 + ($markup / 100)), 2);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function deliveryItems()
    {
        return $this->hasMany(DeliveryItem::class);
    }
}
