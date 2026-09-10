<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Order extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'order_code',
        'client_id',
        'client_name',
        'delegate_id',
        'delegate_name',
        'region',
        'wilaya',
        'total_amount',
        'status',
        'payment_method',
        'notes',
    ];

    protected $casts = [
        'total_amount' => 'float',
        'delegate_id' => 'integer',
        'client_id' => 'integer',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class, 'order_id');
    }

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id')->withDefault(function ($client, $order) {
            $client->name = $order->client_name ?: 'Client Inconnu';
            $client->phone = '-';
            $client->region = $order->region ?: '-';
            $client->wilaya = $order->wilaya ?: '-';
        });
    }

    public function delegate()
    {
        return $this->belongsTo(User::class, 'delegate_id')->withDefault(function ($delegate, $order) {
            $delegate->name = $order->delegate_name ?: 'Unassigned';
            $delegate->role = 'delegate';
        });
    }

    public function validationLogs()
    {
        return $this->hasMany(OrderValidationLog::class, 'order_id')->orderBy('created_at', 'desc');
    }
}
