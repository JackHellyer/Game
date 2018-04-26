// load the express package and create our app
var express = require('express');
var app     = express();
var config  = require('./config');
var bodyParser = require('body-parser');
var morgan  = require('morgan');
var mongoose = require('mongoose');
var path    = require('path');
var server  = require('http').Server(app);
var io      = require('socket.io')(server, {});

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

var socketList = {};


var Entity = function() {
    var self = {
        x:250,
        y:250,
        xSpeed:0,
        ySpeed:0,
        id:''
    }

    self.refresh = function(){
        self.refreshPosition();
    }

    self.refreshPosition = function(){
        self.x += self.xSpeed;
        self.y += self.ySpeed;
    }
    return self;
}

var Player = function(id) {

    var self = Entity();
    self.id = id;
    self.number = "" + Math.floor(10 * Math.random());
    self.moveRight = false;
    self.moveLeft = false;
    self.moveUp = false;
    self.moveDown = false;
    self.speed = 10;

    var super_refresh = self.refresh;

    self.refresh = function() {
        self.refreshSpeed();
        super_refresh();
    }




    self.refreshSpeed = function() {
        if(self.moveRight)
            self.xSpeed = self.speed;
        else if(self.moveLeft)
            self.xSpeed = -self.speed;
        else
            self.xSpeed = 0;


        if(self.moveUp)
            self.ySpeed = -self.speed;
        else if(self.moveDown)
            self.ySpeed = self.speed;
        else
            self.ySpeed = 0;
    }

    Player.list[id] = self;
    return self;
}

Player.list = {};

Player.onConnect = function(socket){
    var player = Player(socket.id);

    socket.on('keyPress', function (data){
        if(data.input === 'right')
            player.moveRight = data.state;
        else if(data.input === 'down')
            player.moveDown = data.state;
        else if(data.input === 'left')
            player.moveLeft = data.state;
        else if(data.input === 'up')
            player.moveUp = data.state;


    });

}

Player.onDisconnect = function(socket){
    delete Player.list[socket.id];
}

Player.refresh = function() {
    var pack = [];
    for (var i in Player.list) {
        var player = Player.list[i];
        player.refresh();
        //console.log(player.x);
        pack.push({
            x: player.x,
            y: player.y,
            number: player.number
            //number: socket.number
        });
    }
    return pack;
}

var Bullet = function(angle) {
    var self = Entity();
    self.id = Math.random();
    self.xSpeed = Math.cos(angle/180*Math.PI) * 10;
    self.ySpeed = Math.sin(angle/180*Math.PI) * 10;

    self.timer = 0;
    self.toRemove = false;

    var super_refresh = self.refresh;
    self.refresh = function() {
        if(self.timer++ > 100)
            self.toRemove = true;
        super_refresh();
    }
    Bullet.list[self.id] = self;
    return self;
}

Bullet.list = {};

Bullet.refresh = function() {
    if(Math.random() < 0.1)
        Bullet(Math.random() * 360);


    var pack = [];

    for (var i in Bullet.list) {
        var bullet = Bullet.list[i];
        bullet.refresh();
        pack.push({
            x:bullet.x,
            y:bullet.y
        });
    }
    return pack;
}

io.sockets.on('connection', function (socket){
        console.log('socket connection');
    socket.id = Math.random();
    socketList[socket.id] = socket;

    Player.onConnect(socket);
    //console.log(socket.id);
    //console.log(Object.keys(io.sockets.sockets));
    console.log(Object.keys(socketList));
    //console.log(Object.keys(playerList));



    socket.on('send message', function (data){
        io.sockets.emit('new message', data );
    });





        //socket.number = "" + Math.floor(10 * Math.random());

        socket.on('disconnect', function(){
            delete socketList[socket.id];
            Player.onDisconnect(socket);
            console.log("player disconnected");
        });
});





setInterval(function(){

    var pack = {
        player:Player.refresh(),
        bullet:Bullet.refresh()
    }

    for(var i in socketList){
        var socket = socketList[i];
        socket.emit('newPositions', pack);


    }



}, 1000/25);




