const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const validateDomain = require('../middlewares/validateStore');

router.post('/sync', cartController.syncCart);

module.exports = router;