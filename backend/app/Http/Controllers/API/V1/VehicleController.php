<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Http\Resources\V1\VehicleResource;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    public function index()
    {
        return VehicleResource::collection(Vehicle::with('customer')->latest()->paginate(10));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'plate_number' => 'required|string|unique:vehicles,plate_number',
            'vin' => 'required|string|unique:vehicles,vin',
            'brand' => 'required|string',
            'model' => 'required|string',
            'year' => 'required|integer|min:1900|max:'.(date('Y') + 1),
            'transmission' => 'required|string',
            'fuel_type' => 'required|string',
            'mileage' => 'required|integer|min:0',
            'color' => 'required|string',
        ]);

        $vehicle = Vehicle::create($validated);

        return new VehicleResource($vehicle);
    }

    public function show(Vehicle $vehicle)
    {
        return new VehicleResource($vehicle->load(['customer', 'jobOrders']));
    }

    public function update(Request $request, Vehicle $vehicle)
    {
        $validated = $request->validate([
            'customer_id' => 'sometimes|required|exists:customers,id',
            'plate_number' => 'sometimes|required|string|unique:vehicles,plate_number,'.$vehicle->id,
            'vin' => 'sometimes|required|string|unique:vehicles,vin,'.$vehicle->id,
            'brand' => 'sometimes|required|string',
            'model' => 'sometimes|required|string',
            'year' => 'sometimes|required|integer|min:1900|max:'.(date('Y') + 1),
            'transmission' => 'sometimes|required|string',
            'fuel_type' => 'sometimes|required|string',
            'mileage' => 'sometimes|required|integer|min:0',
            'color' => 'sometimes|required|string',
        ]);

        $vehicle->update($validated);

        return new VehicleResource($vehicle);
    }

    public function destroy(Vehicle $vehicle)
    {
        $vehicle->delete();

        return response()->json(null, 204);
    }
}
