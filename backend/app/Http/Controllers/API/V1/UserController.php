<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('roles.permissions');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%")
                  ->orWhere('username', 'like', "%{$s}%")
                  ->orWhere('contact_number', 'like', "%{$s}%");
            });
        }

        $users = $query->orderBy('name')->get()->map(function ($u) {
            $perms = [];
            if ($u->role === 'super_admin' || $u->role === 'admin') {
                $perms = ['*'];
            } else {
                foreach ($u->roles as $r) {
                    foreach ($r->permissions as $p) {
                        $perms[] = $p->slug;
                    }
                }
                $perms = array_values(array_unique($perms));
            }

            return [
                'id' => $u->id,
                'name' => $u->name,
                'username' => $u->username,
                'email' => $u->email,
                'contact_number' => $u->contact_number,
                'avatar' => $u->avatar,
                'role' => $u->role,
                'status' => $u->status ?? 'active',
                'roles' => $u->roles,
                'role_names' => $u->roles->pluck('name')->toArray(),
                'role_ids' => $u->roles->pluck('id')->toArray(),
                'permissions' => $perms,
                'last_login_at' => $u->last_login_at,
                'created_at' => $u->created_at,
                'updated_at' => $u->updated_at,
            ];
        });

        return response()->json(['data' => $users]);
    }

    public function show($id)
    {
        $u = User::with('roles.permissions')->findOrFail($id);

        $perms = [];
        if ($u->role === 'super_admin' || $u->role === 'admin') {
            $perms = ['*'];
        } else {
            foreach ($u->roles as $r) {
                foreach ($r->permissions as $p) {
                    $perms[] = $p->slug;
                }
            }
            $perms = array_values(array_unique($perms));
        }

        return response()->json([
            'data' => [
                'id' => $u->id,
                'name' => $u->name,
                'username' => $u->username,
                'email' => $u->email,
                'contact_number' => $u->contact_number,
                'avatar' => $u->avatar,
                'role' => $u->role,
                'status' => $u->status ?? 'active',
                'roles' => $u->roles,
                'role_names' => $u->roles->pluck('name')->toArray(),
                'role_ids' => $u->roles->pluck('id')->toArray(),
                'permissions' => $perms,
                'last_login_at' => $u->last_login_at,
                'created_at' => $u->created_at,
                'updated_at' => $u->updated_at,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'nullable|string|max:100|unique:users,username',
            'email' => 'required|email|unique:users,email',
            'contact_number' => 'nullable|string|max:50',
            'password' => 'required|string|min:6',
            'role' => 'nullable|string',
            'role_ids' => 'nullable|array',
            'status' => 'nullable|in:active,inactive',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'username' => $validated['username'] ?? null,
            'email' => strtolower(trim($validated['email'])),
            'contact_number' => $validated['contact_number'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'] ?? 'service_advisor',
            'status' => $validated['status'] ?? 'active',
            'created_by' => $request->user()?->id,
        ]);

        if (!empty($validated['role_ids'])) {
            $user->roles()->sync($validated['role_ids']);
        } elseif ($user->role) {
            $r = Role::where('slug', $user->role)->first();
            if ($r) $user->roles()->sync([$r->id]);
        }

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'user_name' => $request->user()?->name ?? 'System',
            'user_email' => $request->user()?->email,
            'action' => 'create',
            'module' => 'users',
            'record_id' => $user->id,
            'description' => "Created user \"{$user->name}\" ({$user->email})",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return response()->json(['data' => $user->load('roles')], 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'username' => 'nullable|string|max:100|unique:users,username,' . $id,
            'email' => 'sometimes|required|email|unique:users,email,' . $id,
            'contact_number' => 'nullable|string|max:50',
            'password' => 'nullable|string|min:6',
            'role' => 'nullable|string',
            'role_ids' => 'nullable|array',
            'status' => 'nullable|in:active,inactive',
        ]);

        if (($user->role === 'admin' || $user->role === 'super_admin') && ($validated['status'] ?? '') === 'inactive') {
            $adminCount = User::whereIn('role', ['admin', 'super_admin'])->where('status', 'active')->count();
            if ($adminCount <= 1) {
                return response()->json(['message' => 'Cannot deactivate the only active Super Administrator.'], 400);
            }
        }

        $updates = [
            'name' => $validated['name'] ?? $user->name,
            'username' => array_key_exists('username', $validated) ? $validated['username'] : $user->username,
            'email' => isset($validated['email']) ? strtolower(trim($validated['email'])) : $user->email,
            'contact_number' => array_key_exists('contact_number', $validated) ? $validated['contact_number'] : $user->contact_number,
            'role' => $validated['role'] ?? $user->role,
            'status' => $validated['status'] ?? $user->status,
        ];

        if (!empty($validated['password'])) {
            $updates['password'] = Hash::make($validated['password']);
        }

        $user->update($updates);

        if (isset($validated['role_ids'])) {
            $user->roles()->sync($validated['role_ids']);
        }

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'user_name' => $request->user()?->name ?? 'System',
            'user_email' => $request->user()?->email,
            'action' => 'update',
            'module' => 'users',
            'record_id' => $user->id,
            'description' => "Updated user profile \"{$user->name}\"",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return response()->json(['data' => $user->load('roles')]);
    }

    public function resetPassword(Request $request, $id)
    {
        $request->validate(['password' => 'required|string|min:6']);
        $user = User::findOrFail($id);
        $user->update(['password' => Hash::make($request->password)]);

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'user_name' => $request->user()?->name ?? 'System',
            'user_email' => $request->user()?->email,
            'action' => 'reset_password',
            'module' => 'users',
            'record_id' => $user->id,
            'description' => "Reset password for user \"{$user->name}\"",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Password reset successfully.']);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate(['status' => 'required|in:active,inactive']);
        $user = User::findOrFail($id);

        if ($user->id === $request->user()?->id && $request->status === 'inactive') {
            return response()->json(['message' => 'Cannot deactivate your own account.'], 400);
        }

        $user->update(['status' => $request->status]);

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'user_name' => $request->user()?->name ?? 'System',
            'user_email' => $request->user()?->email,
            'action' => $request->status === 'active' ? 'activate_user' : 'deactivate_user',
            'module' => 'users',
            'record_id' => $user->id,
            'description' => "Set user \"{$user->name}\" status to " . strtoupper($request->status),
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return response()->json(['data' => $user]);
    }

    public function destroy(Request $request, $id)
    {
        $user = User::findOrFail($id);

        if ($user->id === $request->user()?->id) {
            return response()->json(['message' => 'Cannot delete your own account.'], 400);
        }

        if ($user->role === 'admin' || $user->role === 'super_admin') {
            $adminCount = User::whereIn('role', ['admin', 'super_admin'])->count();
            if ($adminCount <= 1) {
                return response()->json(['message' => 'Cannot delete the only Super Administrator account.'], 400);
            }
        }

        $user->roles()->detach();
        $user->delete();

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'user_name' => $request->user()?->name ?? 'System',
            'user_email' => $request->user()?->email,
            'action' => 'delete',
            'module' => 'users',
            'record_id' => $id,
            'description' => "Deleted user \"{$user->name}\" ({$user->email})",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return response()->json(null, 204);
    }
}
