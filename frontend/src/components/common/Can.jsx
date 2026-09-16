import usePermission from '../../hooks/usePermission';

/**
 * Declarative component for permission-based rendering.
 * Usage:
 * <Can do="customers.create">
 *    <button>Add Customer</button>
 * </Can>
 * <Can any={['users.edit', 'users.delete']}>
 *    <span>Actions</span>
 * </Can>
 */
const Can = ({ do: action, any: anyActions, all: allActions, role, fallback = null, children }) => {
    const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole } = usePermission();

    if (role && !hasRole(role)) {
        return fallback;
    }

    if (action && !hasPermission(action)) {
        return fallback;
    }

    if (anyActions && !hasAnyPermission(anyActions)) {
        return fallback;
    }

    if (allActions && !hasAllPermissions(allActions)) {
        return fallback;
    }

    return <>{children}</>;
};

export default Can;
