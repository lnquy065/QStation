var express = require("express");
var app = express();
var bodyParser = require('body-parser');
var firebase = require('firebase');
const brain = require('brain.js');
const cron = require('cron').CronJob;
var path = require('path');
var bodyParser = require('body-parser');

var fbUsername = "lnquy065@gmail.com";
var fbPassword = "123456";



//PATH
var appPath = {
    login: path.join(__dirname+'/views/login.html'),
    account: path.join(__dirname+'/views/accmanager.html'),
    accessdenied: path.join(__dirname+'/views/accessdenied.html'),
    loginRequired: path.join(__dirname+'/views/loginrequired.html'),
    index: path.join(__dirname+'/views/index.html')
}

//middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
  })); 
//route
app.use('/node/chart/:id/:date', getNodeChartByDate);
app.use('/node/data/:id/:limit', getNodeChartByLimit);
app.use('/node/predict/:id', getPredictionCo2);
//app.use('/nodeupdate/:id/:co2/:dust/:uv/:timeStamp', postDataTimeStampInclude);
app.use('/node/:id/:co2/:dust/:uv', postData);

app.use('/node', getNodesList);
app.use('/res/img', express.static('res/img'));

app.use('/map', (req, res) => {
    res.sendFile('views/map.html',  {root: __dirname});
});


app.get('/', (req, res) => {
    checkApproved(isApproved => {
        console.log('Approved', isApproved);
        if (isApproved === null) {
            res.sendFile(appPath.login);
        } else {
            if (!isApproved) {
                res.sendFile(appPath.accessdenied);
            } else {
                res.sendFile(appPath.index);
            }
        }
       
    });
})


app.get('/account', (req, res) => {
    checkApproved(isApproved => {
        console.log('Approved', isApproved);
        if (isApproved === null) {
            res.sendFile(appPath.loginRequired);
        } else {
            if (!isApproved) {
                res.sendFile(appPath.accessdenied);
            } else {
                res.sendFile(appPath.account);
            }
        }
       
    });
})

app.post('/login', loginRequest);
app.post('/register', registerRequest);
app.get('/logout', logoutRequest);

app.get('/users', usersListRequest);
app.get('/approved/:uid', approvedRequest);


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
var database = firebase.database();


//Cronjob start
const job = new cron('00 00 01 * * *', function() {
    predictCo2AllNode();
}, null, null, 'Asia/Ho_Chi_Minh');



//FUNCION


/*
Du doan Co2 cho tat ca cac node
*/
function predictCo2AllNode() {
  //Lay danh sach cac node
  let nodeInfoRef  = firebase.database().ref('/nodeInfo');
  nodeInfoRef.once("value").then(function(snapshot) {
     // console.log(snapshot.key);
      snapshot.forEach( s => {
          //Du doan va luu vao
          
          if (s.key === 'N04' ) predictCo2Value(s.key);
      });
  });
}

/*
Chap nhan cho tai khoan moi
*/
function approvedRequest(req, res) {
    let uid = req.params.uid;
    checkApproved(isApproved => {
        console.log('Approved', isApproved);
        if (isApproved === null) {
            res.sendFile(appPath.loginRequired);
        } else {
            if (!isApproved) {
                res.sendFile(appPath.accessdenied);
            } else {
                database.ref('users').child(uid).update(
                    {
                    approved: true}
                );
                res.sendFile(appPath.account);
            }
        }
    });
}


/*
Lay du lieu cua mot Node theo so mau tin
*/ 
function getNodeChartByLimit(req, res) {
    let id = req.params.id;
    let limit = parseInt(req.params.limit);

   // console.log(limit);

    let retJson = [];
    let nodeDataRef  = firebase.database().ref('/nodeData/'+id);
    nodeDataRef.limitToLast(limit).once('value').then( snapshot => {
        snapshot.forEach( s => {
            retJson.push(s);
        })
        res.send(retJson);
    });
}

/*
Lay du lieu cua mot Node trong 1 ngay
*/
function getNodeChartByDate(req, res) {
    let date = new Date(req.params.date);
    date.setHours(date.getHours() - 7);
    let id = req.params.id;
    let startTime = date.getTime();
   
    let endTime = new Date(date);
    endTime.setHours(endTime.getHours() + 24);
    endTime = endTime.getTime();
    let retJson = [];
    let nodeDataRef  = firebase.database().ref('/nodeData/'+id);
    nodeDataRef.orderByChild('timeStamp').startAt(startTime).endAt(endTime).once('value').then( snapshot => {
        snapshot.forEach( s => {
            retJson.push(s);
        })
        res.send(retJson);
    });
}

/*
Du doan du lieu Co2 ngay mai va luu vao firebase
*/
function predictCo2Value(nodeId) {
    //Lay du lieu 20 ngay gan nhat
    let date = new Date();
    date.setDate(date.getDate() - 20);
    let id = nodeId;
    let startTime = date.getTime();
   
    let endTime = new Date();
    endTime = endTime.getTime();
    let retJson = [];
    let dataByDate  = {};

    let nodeDataRef  = firebase.database().ref('/nodeData/'+id);
    nodeDataRef.orderByChild('timeStamp').startAt(startTime).endAt(endTime).once('value').then( snapshot => {
        snapshot.forEach( s => {
            //Luu thanh mang Key -> Array, voi Key la ngay dang chuoi. vd 27112018
            let tDate = new Date(s.val().timeStamp);
            let dateString = tDate.getDate()<10? '0'+tDate.getDate():tDate.getDate() + '';
            dateString +=  ''+(tDate.getMonth()+1)<10? '0'+(tDate.getMonth()+1):(tDate.getMonth()+1);
            dateString += ''+tDate.getFullYear();
            //Chia tung goi du lieu theo tung Key
            if (dataByDate[dateString] === undefined ) dataByDate[dateString] = [];
            dataByDate[dateString].push(s.val().vCo2);
            retJson.push(s);
        })
        
        //Tinh trung binh tung ngay
        var pretrainArray = [];
        for(keys in dataByDate) {
            let co2Array = dataByDate[keys];
            let sumCo2 = co2Array.reduce( (a,b) => a + b);
            pretrainArray.push(  Math.round(sumCo2 / co2Array.length)  );
        }
        let maxV = Math.max.apply(Math, pretrainArray);
        let minV = Math.min.apply(Math, pretrainArray);
        let delta = maxV - minV;

        //May hoc, su dung mang LSTMTimeStep
        let net = new brain.recurrent.LSTMTimeStep();
        let sliced = pretrainArray.slice(-1);
        net.train( [pretrainArray.slice(0, -1)] );
        
        let predictedCo2 = net.run( sliced ) * delta;

        //Luu vao firebase
        let tDate = new Date();
        let dateString = tDate.getDate()<10? '0'+tDate.getDate():tDate.getDate() + '';
        dateString +=  ''+(tDate.getMonth()+1)<10? '0'+(tDate.getMonth()+1):(tDate.getMonth()+1);
        dateString += ''+tDate.getFullYear();
        writePredictionValue(id, dateString, predictedCo2);
    });
}


function getPredictionCo2(req, res) {
    let id = req.params.id;
    let tDate = new Date();
    let dateString = tDate.getDate()<10? '0'+tDate.getDate():tDate.getDate() + '';
    dateString +=  ''+(tDate.getMonth()+1)<10? '0'+(tDate.getMonth()+1):(tDate.getMonth()+1);
    dateString += ''+tDate.getFullYear();
    console.log('/nodePrediction/'+id + '/' +dateString);
    let nodeInfoRef  = firebase.database().ref('/nodePrediction/'+id).child(dateString);
    nodeInfoRef.once("value").then(function(snapshot) {
        let co2 = snapshot.val();
        if (co2 !== null) res.send( JSON.parse('{"co2": "'+co2+'"}'));
        else res.send( JSON.parse('{"co2": "'+0+'"}'));
    });
}



function getNodesList(req, res) {
    let nodeInfoRef  = firebase.database().ref('/nodeInfo');
    let retJson = [];
    nodeInfoRef.once("value").then(function(snapshot) {
       // console.log(snapshot.key);
        snapshot.forEach( s => {
            let s2 = s.val();
            s2.id = s.key;
            retJson.push(s2);
          //  console.log(s.key + ' - ' + s.val());
            
        });
        res.send(retJson);
    });

}


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



function postDataTimeStampInclude(req, res) {
    var nodeId = req.params.id;
    var nodeCo2 = req.params.co2;
    var nodeDust = req.params.dust;
    var nodeUv = req.params.uv;
    var timeStamp = req.params.timeStamp;
    firebase.database().ref('/nodeData').child(nodeId).push( {
        "timeStamp": parseInt(timeStamp),
        "vCo2": parseFloat(nodeCo2),
        "vDust": parseFloat(nodeDust),
        "vUv": parseFloat(nodeUv)
    })
    
    res.send('successTimestamp');
}


function writePredictionValue(nodeId, dateString, value) {
    firebase.database().ref('/nodePrediction').child(nodeId).child(dateString).set(isNaN(value)? 0: Math.round(value));
}


function usersListRequest(req, res) {
    checkApproved(isApproved => {
        console.log('Approved', isApproved);
        if (isApproved === null) {
            res.sendFile(appPath.loginRequired);
        } else {
            if (!isApproved) {
                res.sendFile(appPath.accessdenied);
            } else {
                let retJSON = [];
                database.ref('users').on('child_added', snapshot => {
                    retJSON.push( {uid: snapshot.key, val: snapshot.val()} );
                    
                });
                res.send(retJSON );
            }
        }
       
    });
}

function logoutRequest(req, res) {
    firebase.auth().signOut().then( () => {
        res.sendFile(appPath.login);
    });
}

function loginRequest(req, res) {
    firebase.auth().signInWithEmailAndPassword(req.body.username,req.body.password).then( user => {
        res.send(JSON.parse('{"code": "ok"}'));
    }).catch( error => {
        res.send(error);
    });
}

function registerRequest(req, res) {
    let username = req.body.username;
    let password = req.body.password;
    console.log(username, password);

    firebase.auth().createUserWithEmailAndPassword(username, password).then( user => {
        //Luu UID
        database.ref('users').child(user.user.uid).set(
            {email: user.user.email,
            approved: false,
            role: 'user'}
        );
        
        res.send(JSON.parse('{"code": "ok"}'));
    }).catch( error => {
        res.send(error);
    })
}

function checkApproved(approved) {
    // approved(true);
    // return;
    let user = firebase.auth().currentUser;
    if (user === null) return approved(null);
    database.ref('users').child(user.uid).once('value').then( snapshot => {
        approved(snapshot.val().approved);
    });
}

