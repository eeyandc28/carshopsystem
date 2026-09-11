<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Delivery extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'delivery_number',
        'supplier_id',
        'received_by',
        'received_date',
        'reference_number',
        'notes',
        'status',
    ];

    protected $casts = [
        'received_date' => 'date',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function items()
    {
        return $this->hasMany(DeliveryItem::class);
    }

    public function getTotalCostAttribute(): float
    {
        return $this->items->sum(fn($i) => (float) $i->total_cost);
    }

    public function getTotalItemsAttribute(): int
    {
        return $this->items->sum('quantity_received');
    }
}
