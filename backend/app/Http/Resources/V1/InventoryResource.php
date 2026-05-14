<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryResource extends JsonResource
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
            'name' => $this->name,
            'part_number' => $this->part_number,
            'barcode_sku' => $this->barcode_sku,
            'brand' => $this->brand,
            'stock_quantity' => $this->stock_quantity,
            'reorder_level' => $this->reorder_level,
            'unit_price' => (float) $this->unit_price,
            'supplier' => $this->whenLoaded('supplier'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
