<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vehicle extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'customer_id',
        'plate_number',
        'vin',
        'engine_number',
        'brand',
        'model',
        'year',
        'transmission',
        'fuel_type',
        'mileage',
        'color',
        'photo_path',
        'orcr_path',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function jobOrders()
    {
        return $this->hasMany(JobOrder::class);
    }
}
