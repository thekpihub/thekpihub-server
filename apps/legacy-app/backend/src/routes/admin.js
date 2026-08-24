const router = require('express').Router();
const { body, param } = require('express-validator');

const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { adminGuard, adminAudit } = require('../middleware/adminGuard');
const validate = require('../middleware/validate');

router.use(authenticate);
router.use(adminGuard);

router.get('/overview',          adminController.getOverview);
router.get('/users',             adminController.listUsers);
router.get('/users/:id',         param('id').isUUID(), validate, adminController.getUser);

router.patch('/users/:id/status',
  adminAudit('user.status.update'),
  [param('id').isUUID(), body('status').isIn(['active','inactive','suspended'])],
  validate, adminController.updateUserStatus
);

router.patch('/users/:id/role',
  adminAudit('user.role.update'),
  [param('id').isUUID(), body('role').isIn(['super_admin','admin','analyst','viewer'])],
  validate, adminController.updateUserRole
);

router.delete('/users/:id',        adminAudit('user.delete'),       param('id').isUUID(), validate, adminController.deleteUser);
router.post('/users/:id/impersonate', adminAudit('user.impersonate'), param('id').isUUID(), validate, adminController.impersonateUser);

router.get('/orgs',              adminController.listOrgs);
router.get('/orgs/:id',          param('id').isUUID(), validate, adminController.getOrg);
router.patch('/orgs/:id/status',
  adminAudit('org.status.update'),
  [param('id').isUUID(), body('is_active').isBoolean()],
  validate, adminController.updateOrgStatus
);

router.get('/billing/overview',      adminController.getBillingOverview);
router.get('/billing/invoices',      adminController.listAllInvoices);
router.get('/billing/subscriptions', adminController.listAllSubscriptions);
router.post('/billing/grant-plan',
  adminAudit('billing.plan.grant'),
  [body('orgId').isUUID(), body('planSlug').notEmpty(), body('reason').notEmpty()],
  validate, adminController.grantPlan
);

router.get('/system/health', adminController.getSystemHealth);
router.get('/system/stats',  adminController.getSystemStats);
router.get('/system/logs',   adminController.getRecentLogs);

router.get('/announcements',     adminController.listAnnouncements);
router.post('/announcements',    adminAudit('announcement.create'),
  [body('title').notEmpty().isLength({ max: 150 }), body('message').notEmpty(),
   body('type').isIn(['info','warning','critical','maintenance']),
   body('target').isIn(['all','free','pro','enterprise'])],
  validate, adminController.createAnnouncement
);
router.patch('/announcements/:id',  param('id').isUUID(), validate, adminController.updateAnnouncement);
router.delete('/announcements/:id', adminAudit('announcement.delete'), param('id').isUUID(), validate, adminController.deleteAnnouncement);

module.exports = router;
