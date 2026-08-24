const router = require('express').Router();
const { body, param } = require('express-validator');

const kpiController = require('../controllers/kpiController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const planGate = require('../middleware/planGate');

router.use(authenticate);

const kpiRules = [
  body('name').trim().isLength({ min: 2, max: 150 }).withMessage('KPI name required'),
  body('frequency').isIn(['realtime','daily','weekly','monthly','quarterly','yearly']),
  body('data_type').isIn(['number','percentage','currency','ratio','boolean']),
  body('direction').isIn(['higher_is_better','lower_is_better','target_is_better']),
];

const valueRules = [
  body('value').isNumeric().withMessage('Value must be a number'),
  body('period_start').isDate().withMessage('Valid period start required'),
  body('period_end').isDate().withMessage('Valid period end required'),
  body('period_type').isIn(['daily','weekly','monthly','quarterly','yearly']),
];

router.get('/',          requirePermission('kpis:read'),   kpiController.list);
router.get('/summary',   requirePermission('kpis:read'),   kpiController.summary);
router.post('/',         requirePermission('kpis:write'),  planGate('kpis'), kpiRules, validate, kpiController.create);
router.get('/:id',       requirePermission('kpis:read'),   param('id').isUUID(), validate, kpiController.getOne);
router.put('/:id',       requirePermission('kpis:write'),  param('id').isUUID(), kpiRules, validate, kpiController.update);
router.delete('/:id',    requirePermission('kpis:manage'), param('id').isUUID(), validate, kpiController.remove);

router.get('/:id/values',  requirePermission('kpis:read'),  kpiController.getValues);
router.post('/:id/values', requirePermission('kpis:write'), valueRules, validate, kpiController.addValue);
router.get('/:id/trend',   requirePermission('kpis:read'),  kpiController.getTrend);
router.get('/:id/targets', requirePermission('kpis:read'),  kpiController.getTargets);
router.post('/:id/targets',
  requirePermission('kpis:write'),
  [body('target_value').isNumeric(), body('target_date').isDate()],
  validate,
  kpiController.setTarget
);

module.exports = router;
