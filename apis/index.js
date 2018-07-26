var express = require('express');
var router = express.Router();
var path = require('path');



router.use('/api/nodes', require('./node'));


module.exports = router;