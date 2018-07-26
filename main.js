var express = require("express");
var app = express();
var bodyParser = require('body-parser');
var firebase = require('firebase');

//middleware
app.use(bodyParser.json());
//route
app.use('/node/:id/:co2/:dust/:uv', postData);


//server start
var server = app.listen((process.env.PORT || 3000), function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Server is running at '+host+' '+port);
});  

//firebase start
var config = {
    apiKey: "AIzaSyDxyHBFqWHTd4Uzs9p4TvmgmSEuInNDk5Q",
    authDomain: "qstation-5bd62.firebaseapp.com",
    databaseURL: "https://qstation-5bd62.firebaseio.com",
    storageBucket: "qstation-5bd62.appspot.com",
  };
firebase.initializeApp(config);


//main function
function postData(req, res) {
    var nodeId = req.params.id;
    var nodeCo2 = req.params.co2;
    var nodeDust = req.params.dust;
    var nodeUv = req.params.uv;
    firebase.database().ref('/nodeData').child(nodeId).push( {
        "timeStamp": firebase.database.ServerValue.TIMESTAMP,
        "vCo2": parseFloat(nodeCo2),
        "vDust": parseFloat(nodeDust),
        "vUv": parseFloat(nodeUv)
    })
    
    res.send('success');
}