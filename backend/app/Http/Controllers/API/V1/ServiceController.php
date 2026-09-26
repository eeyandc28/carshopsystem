<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Service::query();

        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('keyword', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->has('active_only') && $request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        $services = $query->orderBy('name')->get();

        return response()->json([
            'data' => $services
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:150|unique:services,name',
            'code'        => 'nullable|string|max:50|unique:services,code',
            'type'        => 'nullable|string|max:100',
            'keyword'     => 'nullable|string|max:255',
            'description' => 'nullable|string|max:500',
            'inclusions'  => 'nullable|array',
            'price'       => 'required|numeric|min:0',
            'is_active'   => 'nullable|boolean',
        ]);

        $service = Service::create([
            'name'        => $validated['name'],
            'code'        => $validated['code'] ?? null,
            'type'        => $validated['type'] ?? null,
            'keyword'     => $validated['keyword'] ?? null,
            'description' => $validated['description'] ?? null,
            'inclusions'  => $validated['inclusions'] ?? [],
            'price'       => $validated['price'],
            'is_active'   => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Service created successfully',
            'data'    => $service,
        ], 201);
    }

    public function update(Request $request, Service $service)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:150|unique:services,name,' . $service->id,
            'code'        => 'nullable|string|max:50|unique:services,code,' . $service->id,
            'type'        => 'nullable|string|max:100',
            'keyword'     => 'nullable|string|max:255',
            'description' => 'nullable|string|max:500',
            'inclusions'  => 'nullable|array',
            'price'       => 'required|numeric|min:0',
            'is_active'   => 'nullable|boolean',
        ]);

        $service->update($validated);

        return response()->json([
            'message' => 'Service updated successfully',
            'data'    => $service,
        ]);
    }

    public function destroy(Service $service)
    {
        $service->delete();

        return response()->json([
            'message' => 'Service deleted successfully'
        ], 200);
    }
}
