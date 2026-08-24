const { query, pool } = require('../config/database');
const cache    = require('../utils/cache');
const response = require('../utils/response');
const audit    = require('../utils/audit');

const kpiController = {
  list: async (req, res, next) => {
    try {
      const { page = 1, limit = 20, status = 'active', search, sortBy = 'name', sortDir = 'asc' } = req.query;
      const orgId    = req.user.org_id;
      const offset   = (page - 1) * limit;
      const cacheKey = `kpis:list:${orgId}:${JSON.stringify(req.query)}`;

      const cached = await cache.get(cacheKey);
      if (cached) return response.paginated(res, cached.data, cached.pagination);

      const params = [orgId, status];
      let where = 'WHERE k.org_id = $1 AND k.status = $2';
      if (search) { where += ` AND k.name ILIKE $${params.length + 1}`; params.push(`%${search}%`); }

      const total = (await query(`SELECT COUNT(*) AS c FROM kpis.kpis k ${where}`, params)).rows[0].c;

      const kpis = await query(
        `SELECT k.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon,
                v.value AS current_value, v.change_percentage, v.period_start AS last_updated
         FROM kpis.kpis k
         LEFT JOIN kpis.categories c ON k.category_id = c.id
         LEFT JOIN LATERAL (
           SELECT value, change_percentage, period_start FROM kpis.kpi_values
           WHERE kpi_id = k.id ORDER BY period_start DESC LIMIT 1
         ) v ON true
         ${where}
         ORDER BY k.${sortBy} ${sortDir === 'desc' ? 'DESC' : 'ASC'}
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      );

      const pagination = { page: parseInt(page), limit: parseInt(limit), total: parseInt(total) };
      await cache.set(cacheKey, { data: kpis.rows, pagination }, 120);
      return response.paginated(res, kpis.rows, pagination);
    } catch (err) { next(err); }
  },

  create: async (req, res, next) => {
    try {
      const { name, category_id, description, unit, frequency, data_type, direction,
              threshold_critical, threshold_warning, threshold_good, threshold_excellent, tags } = req.body;
      const orgId = req.user.org_id;
      const slug  = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const exists = await query(`SELECT id FROM kpis.kpis WHERE org_id=$1 AND slug=$2`, [orgId, slug]);
      if (exists.rows[0]) return response.error(res, 'KPI with this name already exists', 409);

      const kpi = await query(
        `INSERT INTO kpis.kpis (org_id, category_id, owner_id, name, slug, description, unit, frequency,
           data_type, direction, threshold_critical, threshold_warning, threshold_good, threshold_excellent, tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
        [orgId, category_id, req.user.id, name, slug, description, unit, frequency, data_type, direction,
         threshold_critical, threshold_warning, threshold_good, threshold_excellent, JSON.stringify(tags || [])]
      );

      await cache.del(`kpis:list:${orgId}`);
      await audit({ userId: req.user.id, orgId, action: 'kpi.create', entityType: 'kpi', entityId: kpi.rows[0].id, newValues: kpi.rows[0], req });
      return response.created(res, kpi.rows[0]);
    } catch (err) { next(err); }
  },

  getOne: async (req, res, next) => {
    try {
      const { id } = req.params;
      const cached = await cache.get(`kpi:${id}`);
      if (cached) return response.success(res, cached);

      const kpi = await query(
        `SELECT k.*, c.name AS category_name, c.color AS category_color, u.full_name AS owner_name
         FROM kpis.kpis k
         LEFT JOIN kpis.categories c ON k.category_id = c.id
         LEFT JOIN auth.users u ON k.owner_id = u.id
         WHERE k.id=$1 AND k.org_id=$2`,
        [id, req.user.org_id]
      );
      if (!kpi.rows[0]) return response.notFound(res, 'KPI not found');
      await cache.set(`kpi:${id}`, kpi.rows[0], 300);
      return response.success(res, kpi.rows[0]);
    } catch (err) { next(err); }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const existing = await query(`SELECT * FROM kpis.kpis WHERE id=$1 AND org_id=$2`, [id, req.user.org_id]);
      if (!existing.rows[0]) return response.notFound(res, 'KPI not found');

      const { name, description, unit, frequency, category_id,
              threshold_critical, threshold_warning, threshold_good, threshold_excellent, tags } = req.body;

      const updated = await query(
        `UPDATE kpis.kpis SET
           name=COALESCE($1,name), description=COALESCE($2,description), unit=COALESCE($3,unit),
           frequency=COALESCE($4,frequency), category_id=COALESCE($5,category_id),
           threshold_critical=COALESCE($6,threshold_critical), threshold_warning=COALESCE($7,threshold_warning),
           threshold_good=COALESCE($8,threshold_good), threshold_excellent=COALESCE($9,threshold_excellent),
           tags=COALESCE($10,tags), updated_at=NOW()
         WHERE id=$11 RETURNING *`,
        [name, description, unit, frequency, category_id,
         threshold_critical, threshold_warning, threshold_good, threshold_excellent,
         tags ? JSON.stringify(tags) : null, id]
      );

      await cache.del(`kpi:${id}`);
      await audit({ userId: req.user.id, orgId: req.user.org_id, action: 'kpi.update', entityType: 'kpi', entityId: id, oldValues: existing.rows[0], newValues: updated.rows[0], req });
      return response.success(res, updated.rows[0]);
    } catch (err) { next(err); }
  },

  remove: async (req, res, next) => {
    try {
      const { id } = req.params;
      const kpi = await query(`UPDATE kpis.kpis SET status='archived', updated_at=NOW() WHERE id=$1 AND org_id=$2 RETURNING *`, [id, req.user.org_id]);
      if (!kpi.rows[0]) return response.notFound(res, 'KPI not found');
      await cache.del(`kpi:${id}`);
      await audit({ userId: req.user.id, orgId: req.user.org_id, action: 'kpi.archive', entityType: 'kpi', entityId: id, req });
      return response.success(res, null, 'KPI archived');
    } catch (err) { next(err); }
  },

  addValue: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { value, period_type, period_start, period_end, notes } = req.body;

      const prev = await query(`SELECT value FROM kpis.kpi_values WHERE kpi_id=$1 ORDER BY period_start DESC LIMIT 1`, [id]);
      const prevValue = prev.rows[0]?.value;
      const changePercent = prevValue ? ((value - prevValue) / prevValue) * 100 : null;

      const result = await query(
        `INSERT INTO kpis.kpi_values (kpi_id, recorded_by, value, previous_value, change_percentage, period_type, period_start, period_end, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (kpi_id, period_start, period_type)
         DO UPDATE SET value=EXCLUDED.value, change_percentage=EXCLUDED.change_percentage, notes=EXCLUDED.notes, updated_at=NOW()
         RETURNING *`,
        [id, req.user.id, value, prevValue, changePercent, period_type, period_start, period_end, notes]
      );

      await cache.del(`kpi:${id}`);
      await cache.del(`kpi:trend:${id}`);
      return response.created(res, result.rows[0]);
    } catch (err) { next(err); }
  },

  getValues: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 30, period_type } = req.query;
      const offset = (page - 1) * limit;

      const params = [id];
      let where = 'WHERE kpi_id = $1';
      if (period_type) { where += ` AND period_type = $${params.length + 1}`; params.push(period_type); }

      const total  = (await query(`SELECT COUNT(*) AS c FROM kpis.kpi_values ${where}`, params)).rows[0].c;
      const values = await query(`SELECT * FROM kpis.kpi_values ${where} ORDER BY period_start DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]);

      return response.paginated(res, values.rows, { page: parseInt(page), limit: parseInt(limit), total: parseInt(total) });
    } catch (err) { next(err); }
  },

  getTrend: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { months = 12, period_type = 'monthly' } = req.query;
      const cacheKey = `kpi:trend:${id}:${months}:${period_type}`;

      const cached = await cache.get(cacheKey);
      if (cached) return response.success(res, cached);

      const values = await query(
        `SELECT value, change_percentage, period_start, period_end, period_type
         FROM kpis.kpi_values WHERE kpi_id=$1 AND period_type=$2 ORDER BY period_start ASC LIMIT $3`,
        [id, period_type, months]
      );

      await cache.set(cacheKey, values.rows, 300);
      return response.success(res, values.rows);
    } catch (err) { next(err); }
  },

  getTargets: async (req, res, next) => {
    try {
      const { id } = req.params;
      const targets = await query(`SELECT * FROM kpis.kpi_targets WHERE kpi_id=$1 ORDER BY target_date ASC`, [id]);
      return response.success(res, targets.rows);
    } catch (err) { next(err); }
  },

  setTarget: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { target_value, stretch_value, target_date, notes } = req.body;
      const target = await query(
        `INSERT INTO kpis.kpi_targets (kpi_id, set_by, target_value, stretch_value, target_date, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [id, req.user.id, target_value, stretch_value, target_date, notes]
      );
      return response.created(res, target.rows[0]);
    } catch (err) { next(err); }
  },

  summary: async (req, res, next) => {
    try {
      const orgId    = req.user.org_id;
      const cacheKey = `kpis:summary:${orgId}`;
      const cached   = await cache.get(cacheKey);
      if (cached) return response.success(res, cached);

      const result = await query(
        `SELECT
           COUNT(*) FILTER (WHERE k.status = 'active') AS total_kpis,
           COUNT(*) FILTER (WHERE v.value >= k.threshold_excellent) AS excellent_count,
           COUNT(*) FILTER (WHERE v.value >= k.threshold_good AND v.value < k.threshold_excellent) AS good_count,
           COUNT(*) FILTER (WHERE v.value >= k.threshold_warning AND v.value < k.threshold_good) AS warning_count,
           COUNT(*) FILTER (WHERE v.value < k.threshold_critical) AS critical_count,
           AVG(v.change_percentage) AS avg_change_percentage
         FROM kpis.kpis k
         LEFT JOIN LATERAL (SELECT value, change_percentage FROM kpis.kpi_values WHERE kpi_id=k.id ORDER BY period_start DESC LIMIT 1) v ON true
         WHERE k.org_id=$1 AND k.status='active'`,
        [orgId]
      );

      await cache.set(cacheKey, result.rows[0], 60);
      return response.success(res, result.rows[0]);
    } catch (err) { next(err); }
  },
};

module.exports = kpiController;
