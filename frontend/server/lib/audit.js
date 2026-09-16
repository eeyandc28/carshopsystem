const supabase = require('./supabase');

/**
 * Log an action to the audit_logs table.
 * @param {Object} req - Express request object (contains user and IP)
 * @param {Object} data - Audit log payload
 * @param {string} data.action - e.g., 'create', 'update', 'delete', 'assign_role', 'login'
 * @param {string} data.module - e.g., 'users', 'roles', 'customers', 'payments', 'job_orders'
 * @param {string|number} [data.record_id] - Target record ID
 * @param {string} [data.description] - Human-readable summary
 */
const logAudit = async (req, { action, module: mod, record_id, description }) => {
    try {
        const user = req?.user || null;
        const ip = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1';

        await supabase
            .from('audit_logs')
            .insert({
                user_id: user?.id || null,
                user_name: user?.name || user?.email || 'System',
                user_email: user?.email || null,
                action,
                module: mod,
                record_id: record_id ? String(record_id) : null,
                description: description || `${action.toUpperCase()} on ${mod}`,
                ip_address: typeof ip === 'string' ? ip.split(',')[0].trim() : String(ip),
                created_at: new Date().toISOString()
            });
    } catch (err) {
        console.error('[Audit Log Error]', err.message);
    }
};

module.exports = logAudit;
