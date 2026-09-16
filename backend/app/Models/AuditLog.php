<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'user_name',
        'user_email',
        'action',
        'module',
        'record_id',
        'description',
        'ip_address',
        'created_at',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
