const router = require('express').Router();
const { body } = require('express-validator');

const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { query } = require('../config/database');
const response = require('../utils/response');
const logger = require('../config/logger');

router.use(authenticate);
router.use(requirePermission('kpis:read'));

router.post('/insights',
  body('kpiId').isUUID().withMessage('Valid KPI ID required'),
  validate,
  async (req, res, next) => {
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        return response.error(res, 'AI insights not configured', 503);
      }

      const { kpiId, question } = req.body;

      const kpi = await query(
        `SELECT k.*, array_agg(json_build_object('value', v.value, 'period', v.period_start) ORDER BY v.period_start) AS history
         FROM kpis.kpis k
         LEFT JOIN kpis.kpi_values v ON k.id = v.kpi_id
         WHERE k.id = $1 AND k.org_id = $2
         GROUP BY k.id`,
        [kpiId, req.user.org_id]
      );

      if (!kpi.rows[0]) return response.notFound(res, 'KPI not found');

      const Anthropic = require('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const kpiData = kpi.rows[0];
      const prompt = question
        ? `KPI: ${kpiData.name}\nUnit: ${kpiData.unit}\nDirection: ${kpiData.direction}\nHistory: ${JSON.stringify(kpiData.history?.slice(-12))}\n\nQuestion: ${question}`
        : `Analyze this KPI and provide insights:\nKPI: ${kpiData.name}\nUnit: ${kpiData.unit}\nDirection: ${kpiData.direction}\nHistory: ${JSON.stringify(kpiData.history?.slice(-12))}\n\nProvide: trend analysis, anomalies, recommendations.`;

      const message = await client.messages.create({
        model:      'claude-sonnet-4-6',
        max_tokens: 1024,
        messages:   [{ role: 'user', content: prompt }],
      });

      return response.success(res, {
        kpiName: kpiData.name,
        insight: message.content[0].text,
        model:   message.model,
      });
    } catch (err) {
      logger.error('AI insights error', { error: err.message });
      next(err);
    }
  }
);

module.exports = router;
