<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Permission;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RoleController extends Controller
{
    public function index()
    {
        $roles = Role::with(['permissions', 'users'])->get()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'description' => $role->description,
                'is_system' => (bool) $role->is_system,
                'status' => $role->status,
                'users_count' => $role->users->count(),
                'permissions' => $role->permissions,
                'permission_ids' => $role->permissions->pluck('id')->toArray(),
                'permission_slugs' => $role->permissions->pluck('slug')->toArray(),
                'created_at' => $role->created_at,
                'updated_at' => $role->updated_at,
            ];
        });

        return response()->json(['data' => $roles]);
    }

    public function show($id)
    {
        $role = Role::with('permissions')->findOrFail($id);

        return response()->json([
            'data' => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'description' => $role->description,
                'is_system' => (bool) $role->is_system,
                'status' => $role->status,
                'permissions' => $role->permissions,
                'permission_ids' => $role->permissions->pluck('id')->toArray(),
                'permission_slugs' => $role->permissions->pluck('slug')->toArray(),
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'nullable|string|max:100|unique:roles,slug',
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
            'permission_ids' => 'nullable|array',
        ]);

        $slug = $validated['slug'] ?? Str::slug($validated['name'], '_');

        $role = Role::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'is_system' => false,
            'status' => $validated['status'] ?? 'active',
        ]);

        if (!empty($validated['permission_ids'])) {
            $role->permissions()->sync($validated['permission_ids']);
        }

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'user_name' => $request->user()?->name ?? 'System',
            'user_email' => $request->user()?->email,
            'action' => 'create',
            'module' => 'roles',
            'record_id' => $role->id,
            'description' => "Created role \"{$role->name}\" ({$role->slug})",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return response()->json(['data' => $role->load('permissions')], 201);
    }

    public function update(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
            'permission_ids' => 'nullable|array',
        ]);

        if ($role->is_system && $role->slug === 'super_admin' && ($validated['status'] ?? '') === 'inactive') {
            return response()->json(['message' => 'Super Administrator role cannot be deactivated.'], 400);
        }

        $role->update(array_filter([
            'name' => $validated['name'] ?? $role->name,
            'description' => $validated['description'] ?? $role->description,
            'status' => $validated['status'] ?? $role->status,
        ]));

        if (isset($validated['permission_ids'])) {
            $role->permissions()->sync($validated['permission_ids']);
        }

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'user_name' => $request->user()?->name ?? 'System',
            'user_email' => $request->user()?->email,
            'action' => 'update',
            'module' => 'roles',
            'record_id' => $role->id,
            'description' => "Updated role \"{$role->name}\"",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return response()->json(['data' => $role->load('permissions')]);
    }

    public function destroy(Request $request, $id)
    {
        $role = Role::withCount('users')->findOrFail($id);

        if ($role->is_system) {
            return response()->json(['message' => 'System default roles cannot be deleted.'], 400);
        }

        if ($role->users_count > 0) {
            return response()->json([
                'message' => "Cannot delete role '{$role->name}'. It is assigned to {$role->users_count} user(s)."
            ], 400);
        }

        $role->permissions()->detach();
        $role->delete();

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'user_name' => $request->user()?->name ?? 'System',
            'user_email' => $request->user()?->email,
            'action' => 'delete',
            'module' => 'roles',
            'record_id' => $id,
            'description' => "Deleted role \"{$role->name}\"",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return response()->json(null, 204);
    }
}
