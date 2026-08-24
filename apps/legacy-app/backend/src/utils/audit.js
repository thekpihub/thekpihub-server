const { query } = require('../config/database');
const logger = require('../config/logger');

const audit = async ({
  userId,
  orgId,
  action,
  entityType,
  entityId,
  oldValues = {},
  newValues = {},
  req = null,
}) => {
  try {
    await query(
      `INSERT INTO audit.audit_logs
         (user_id, org_id, action, entity_type, entity_id,
          old_values, new_values, ip_address, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        userId,
        orgId,
        action,
        entityType,
        entityId,
        JSON.stringify(oldValues),
        JSON.stringify(newValues),
        req?.ip,
        req?.get('User-Agent'),
      ]
    );
  } catch (err) {
    logger.error('Audit log failed', { error: err.message });
  }
};

module.exports = audit;
