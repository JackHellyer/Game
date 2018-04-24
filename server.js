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


io.sockets.on('connection', function (socket){
        socket.on('send message', function (data){
                io.sockets.emit('new message', data );
            });
    });
