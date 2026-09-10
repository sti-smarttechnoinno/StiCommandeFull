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

    /**
     * Scope query to data visible to the given user based on their regional territory and role.
     */
    public function scopeForUser($query, ?User $user)
    {
        if (!$user || !$user->isRestrictedByRegion()) {
            return $query;
        }

        $table = $this->getTable();
        $region = strtolower(trim($user->region ?? ''));
        $wilayas = $user->getAssignedRegionWilayas();
        $userId = $user->id;

        return $query->where(function ($q) use ($table, $region, $wilayas, $userId) {
            $hasCondition = false;

            if ($userId) {
                $q->where("{$table}.delegate_id", $userId);
                $hasCondition = true;
            }

            if (!empty($region)) {
                $method = $hasCondition ? 'orWhereRaw' : 'whereRaw';
                $q->$method("LOWER(TRIM({$table}.region)) = ?", [$region]);
                $hasCondition = true;
            }

            if (!empty($wilayas)) {
                $method = $hasCondition ? 'orWhere' : 'where';
                $q->$method(function ($subQ) use ($table, $wilayas) {
                    foreach ($wilayas as $idx => $w) {
                        if ($idx === 0) {
                            $subQ->whereRaw("LOWER(TRIM({$table}.wilaya)) = ?", [$w]);
                        } else {
                            $subQ->orWhereRaw("LOWER(TRIM({$table}.wilaya)) = ?", [$w]);
                        }
                    }
                });
                $hasCondition = true;
            }

            if (!$hasCondition) {
                $q->whereRaw('1 = 0');
            }
        });
    }
}
