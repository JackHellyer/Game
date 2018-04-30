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

    self.getDistance = function(pt){
        return Math.sqrt(Math.pow(self.x - pt.x, 2) + Math.pow(self.y - pt.y, 2));
    }


    return self;
}

var Player = function(id) {

    var self = Entity();
    self.id = id;
    self.x = 500;
    self.y = 500;
    self.number = "" + Math.floor(10 * Math.random());
    self.moveRight = false;
    self.moveLeft = false;
    self.moveUp = false;
    self.moveDown = false;
    self.attack = false;
    self.mouseAngle = 0;
    self.speed = 10;
    self.hp = 100;
    self.maxHp = 100;
    self.exp = 0;
    self.level = 1;

    var super_refresh = self.refresh;

    self.refresh = function() {
        self.refreshSpeed();
        super_refresh();

        if(self.attack)
            self.shootBullet(self.mouseAngle);

    }

    self.shootBullet = function(angle) {
        var b = Bullet(self.id, angle);
        b.x = self.x;
        b.y = self.y;
    }




    self.refreshSpeed = function() {
        if(self.moveRight && self.x < 1450)
            self.xSpeed = self.speed;
        else if(self.moveLeft && self.x > 250)
            self.xSpeed = -self.speed;
        else
            self.xSpeed = 0;


        if(self.moveUp && self.y > 250)
            self.ySpeed = -self.speed;
        else if(self.moveDown && self.y < 1150)
            self.ySpeed = self.speed;
        else
            self.ySpeed = 0;
    }

    self.getInitPack = function() {
        return{
            id:self.id,
            x:self.x,
            y:self.y,
            number:self.number,
            hp:self.hp,
            maxHp: self.maxHp,
            exp:self.exp,
            level: self.level
        };


    }

    self.getRefreshedPack = function () {
        return{
            id: self.id,
            x: self.x,
            y: self.y,
            hp: self.hp,
            exp: self.exp,
            level: self.level
        };
    }

    Player.list[id] = self;
    initPack.player.push(self.getInitPack())
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
        else if(data.input === 'attack')
            player.attack = data.state;
        else if (data.input === 'mouseAngle')
            player.mouseAngle = data.state;


    });




    socket.emit('init',{
            selfId:socket.id,
            player:Player.getInitPacks(),
            bullet:Bullet.getInitPacks()

    });

}

Player.getInitPacks = function() {
    var players = [];
    for(var i in Player.list)
        players.push(Player.list[i].getInitPack());
    return players;
}

Player.onDisconnect = function(socket){
    delete Player.list[socket.id];
    removePack.player.push(socket.id);
}

Player.refresh = function() {
    var pack = [];
    for (var i in Player.list) {
        var player = Player.list[i];
        player.refresh();
        //console.log(player.x);
        pack.push(player.getRefreshedPack());
    }
    return pack;
}

var Bullet = function(parent, angle) {
    var self = Entity();
    self.id = Math.random();
    self.xSpeed = Math.cos(angle/180*Math.PI) * 10;
    self.ySpeed = Math.sin(angle/180*Math.PI) * 10;
    self.parent = parent;
    self.timer = 0;
    self.toRemove = false;

    var super_refresh = self.refresh;
    self.refresh = function() {
        if(self.timer++ > 100)
            self.toRemove = true;
        super_refresh();

        for(var i in Player.list)
        {
            var plyr = Player.list[i];
            if(self.getDistance(plyr) < 30 && self.parent !== plyr.id) {
                plyr.hp -= 10;

                if(plyr.hp <= 0)
                {
                    var attacker = Player.list[self.parent];
                    if(attacker)
                    {
                        attacker.exp += 100;

                        if(attacker.exp >= 200)
                        {
                            attacker.level += 1;
                        }
                        /*else if(attacker.exp > 400)
                        {
                            attacker.level += 1;
                        }*/

                    }

                    plyr.hp = plyr.maxHp;
                    plyr.x = Math.floor(Math.random() * 701) + 300;
                    plyr.y = Math.floor(Math.random() * 701) + 300;
                }

                self.toRemove = true;


            }
        }
    }

    self.getInitPack = function() {
        return{
            id: self.id,
            x: self.x,
            y: self.y
        };


    }

    self.getRefreshedPack = function () {
        return{
            id: self.id,
            x: self.x,
            y: self.y
        };
    }

    Bullet.list[self.id] = self;
    initPack.bullet.push(self.getInitPack());
    return self;
}

Bullet.list = {};

Bullet.getInitPacks = function() {
    var bullets = [];
    for(var i in Bullet.list)
        bullets.push(Bullet.list[i].getInitPack());
    return bullets;
}

Bullet.refresh = function() {

    var pack = [];

    for (var i in Bullet.list) {
        var bullet = Bullet.list[i];
        bullet.refresh();
        if(bullet.toRemove)
        {
            delete Bullet.list[i];
            removePack.bullet.push(bullet.id);
        }
        else
        pack.push(bullet.getRefreshedPack());
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



var initPack = {player:[], bullet:[]};
var removePack = {player:[], bullet:[]};

setInterval(function(){

    var pack = {
        player:Player.refresh(),
        bullet:Bullet.refresh()
    }

    for(var i in socketList){
        var socket = socketList[i];
        socket.emit('init', initPack);
        socket.emit('refresh', pack);
        socket.emit('remove', removePack);

    }
    initPack.player = [];
    initPack.bullet = [];
    removePack.player = [];
    removePack.bullet = [];

}, 1000/25);




