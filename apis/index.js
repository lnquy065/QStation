var express = require('express');
var router = express.Router();
var path = require('path');



router.use('/api/nodes', require('./node'));
router.use('/api/clients', require('./client'));


module.exports = router;