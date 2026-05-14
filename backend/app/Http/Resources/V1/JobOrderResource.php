<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JobOrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->job_order_number,
            'status' => $this->status,
            'description' => $this->complaint,
            'diagnosis' => $this->diagnosis,
            'repair_action' => $this->repair_action,
            'promised_at' => $this->estimated_completion,
            'customer' => $this->vehicle ? $this->vehicle->customer : null,
            'vehicle' => $this->vehicle,
            'advisor' => $this->serviceAdvisor,
            'mechanic' => $this->mechanic,
            'created_at' => $this->created_at,
        ];
    }
}
