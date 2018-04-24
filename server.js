// load the express package and create our app
var express = require('express');
var app     = express();
var config  = require('./config');
var bodyParser = require('body-parser');
var morgan  = require('morgan');
var mongoose = require('mongoose');
var path    = require('path');
var server  = require('http').createServer(app);
var io      = require('socket.io').listen(server);

// APP CONFIGURATION

app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization');
    next();
});

app.use(morgan('dev'));

mongoose.connect(config.database);

app.use(express.static(__dirname + '/public'));

// API ROUTES

var apiRoutes = require('./app/routes/api')(app, express);

// prefix api for routes

app.use('/api', apiRoutes);

// send our index.html file to the user for the home page
app.get('*', function(req, res) {
res.sendFile(path.join(__dirname + '/public/app/views/index.html'));
});

// start the server
//app.listen(1337);
server.listen(1337);
console.log('1337 is the magic port!');

var SOCKET_LIST = {};

io.sockets.on('connection', function (socket){
        console.log('socket connection');
    socket.id = Math.random();
    socket.x = 0;
    socket.y = 0;
    SOCKET_LIST[socket.id] = socket;
    //console.log(socket.id);
    console.log(Object.keys(io.sockets.sockets));

    socket.on('send message', function (data){
        io.sockets.emit('new message', data );
    });



        //socket.number = "" + Math.floor(10 * Math.random());

        socket.on('disconnect', function(){
            delete SOCKET_LIST[socket.id];
        })

    });


setInterval(function(){

    var pack = [];
    for (var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        socket.x++;
        socket.y++;
        //console.log(socket.x);
        pack.push({
            x: socket.x,
            y: socket.y
            //number: socket.number
        });

        }





    for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.emit('newPositions', pack);


    }



}, 1000/25);
