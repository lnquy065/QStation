var express = require("express");
var app = express();
var bodyParser = require('body-parser');


app.use(bodyParser.json());
app.use('/', require('./apis'));

var server = app.listen((process.env.PORT || 3000), function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Server is running at '+host+' '+port);
});  

