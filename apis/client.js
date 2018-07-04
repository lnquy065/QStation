var express = require('express');
var router = express.Router();
var con = require('./mysql');

router.get('/android/data/:timeRange', getNDataInTimeRange);



function getNDataInTimeRange(req, res) {
    var timeRange = req.params.timeRange;
    var sql = "SELECT * FROM ndata nn WHERE TIMESTAMPDIFF(HOUR, nn.time, NOW()) <= ?";
    con.query(sql, [timeRange], function(err, results) {
        if (err) {
            res.status(500);
            res.send();
        } else {
            res.status(200);
            res.send(results);
        }
    })
}

module.exports = router;