var express = require('express');
var router = express.Router();
var con = require('./mysql');
var moment = require('moment');




router.get('/list', getNodesList);
router.post('/data', insertNodeResults)

function insertNodeResults(req, res) {
    var results = req.body;
    var token = results.token;
    var nodeID = results.nodeID;
    isValidNode(nodeID, token, function(isValid) {
        if (!isValid) {
            res.status(403);
            res.send();
        } else {
            var sql = "INSERT INTO ss_data(nodeID, time, ssCo2Value, ssDustDensityValue, ssUVDensityValue) VALUES(?, ?, ?, ?, ?)";
            con.query(sql, [results.nodeID, moment().format('YYYY/MM/DD HH:mm:ss'), results.co2, results.dust, results.uv], function(err, result) {
                if (err) {
                    res.status(500);
                } else {
                    res.status(201);
                }
                res.send();
            })
        }
    })

   
}


function isValidNode(nodeID, token, cb) {
    var sql = "SELECT nodeID FROM node WHERE nodeID=? AND token=?";
    con.query(sql, [nodeID, token], function(err, results) {
        if (results.length===0) cb(false);
       cb(true);
    })
}

function getNodesList(req, res) {
    var sql = "SELECT nodeID, startedDate, latitude, longitude FROM node";
    con.query(sql, function(err, results) {
        if (err) throw err;
        res.send(results);
    })
}

module.exports = router;