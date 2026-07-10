const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');

router.get('/:productId', analysisController.getAnalysis);
router.post('/run', analysisController.runAnalysis);

module.exports = router;
