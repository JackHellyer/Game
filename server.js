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


server.listen(config.port);
console.log('1337 is the magic port!');

var socketList = {};

// create object that player and bullet will inherit
var Entity = function() {
    var self = {
        x:250,
        y:250,
        xSpeed:0,
        ySpeed:0,
        id:''
    }
    // refresh the position
    self.refresh = function(){
        self.refreshPosition();
    }
    // refresh position based on the speed
    self.refreshPosition = function(){
        self.x += self.xSpeed;
        self.y += self.ySpeed;
    }

    // get the distance between player and bullet
    self.getDistance = function(pt){
        return Math.sqrt(Math.pow(self.x - pt.x, 2) + Math.pow(self.y - pt.y, 2));
    }


    return self;
}

// Player object, takes in id
var Player = function(id) {
    // inherit entity variabels
    var self = Entity();
    // set player variables
    self.id = id;
    self.x = 500;
    self.y = 500;
    //self.number = "" + Math.floor(10 * Math.random());
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

    // set self refresh from Entity object
    var super_refresh = self.refresh;

    // call the self refresh from entity and refreshSpeed
    self.refresh = function() {
        self.refreshSpeed();
        super_refresh();
        // shoot bullet at angle
        if(self.attack)
            self.shootBullet(self.mouseAngle);
        // if player at
        if(self.attack && self.level > 3)
            for (var i = -1; i < 3; i++)
            {
                self.shootBullet(i * 10 + self.mouseAngle);
            }



    }
    // function used to shoot bullet
    self.shootBullet = function(angle) {
        var b = Bullet(self.id, angle);
        b.x = self.x;
        b.y = self.y;
    }



    // functions to allow the user to move but not outside of the map
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

    // function used to get the init pack
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

    // function used to get the refreshed pack
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
    // add player to list
    Player.list[id] = self;
    // add player variables to the initPack var
    initPack.player.push(self.getInitPack())
    return self;
}

Player.list = {};

// function to deal with player connection, takes in socket
Player.onConnect = function(socket){
    // assign a socket id to the player
    var player = Player(socket.id);

    // recieve key press from the client, including mouse clicks and postions
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



    // send player and bullet information to the client,
    // also selfId which is used to show the player their own score
    socket.emit('init',{
            selfId:socket.id,
            player:Player.getInitPacks(),
            bullet:Bullet.getInitPacks()

    });

}
// get all the active player initPacks
Player.getInitPacks = function() {
    var players = [];
    for(var i in Player.list)
        players.push(Player.list[i].getInitPack());
    return players;
}

// on disconnect remove the player from the player list
Player.onDisconnect = function(socket){
    delete Player.list[socket.id];
    removePack.player.push(socket.id);
}

// function to return refreshed pack
Player.refresh = function() {
    var pack = [];
    for (var i in Player.list) {
        var player = Player.list[i];
        player.refresh();
        pack.push(player.getRefreshedPack());
    }
    return pack;
}

// bullet object takes in parent(the player who shoot the bullet), the angle he wants to shhot the bullet
var Bullet = function(parent, angle) {
    var self = Entity();
    self.id = Math.random();
    // x and y speed used to work out the angle
    self.xSpeed = Math.cos(angle/180*Math.PI) * 10;
    self.ySpeed = Math.sin(angle/180*Math.PI) * 10;
    self.parent = parent;
    self.timer = 0;
    // toRemove bullet false as default
    self.toRemove = false;

    // set super refresh to entity refresh
    var super_refresh = self.refresh;
    self.refresh = function() {
        // remove bullet after a certain amount of time
        if(self.timer++ > 100)
            self.toRemove = true;
        super_refresh();

        // loop through all players
        for(var i in Player.list)
        {
            var plyr = Player.list[i];
            // if distance between the player and the bullet is less then 30 and not the player shooting
            if(self.getDistance(plyr) < 30 && self.parent !== plyr.id) {
                // shoot player loses 10 hp
                plyr.hp -= 10;

                // if player is dead
                if(plyr.hp <= 0)
                {
                    // attacker is the player who shoot
                    var attacker = Player.list[self.parent];
                    // if attacker hasn't disconnected or error
                    if(attacker)
                    {
                        // attacker gets 100 exp
                        attacker.exp += 100;

                        // level up system
                        if(attacker.exp == 300)
                            attacker.level += 1;

                        if(attacker.exp == 500)
                        {
                            attacker.level += 1;

                        }
                        if(attacker.exp == 1000)
                        {
                            attacker.level += 1;

                        }
                        if(attacker.exp == 2500)
                        {
                            attacker.level += 1;
                        }
                        if(attacker.exp == 5000)
                        {
                            attacker.level += 1;
                        }
                        if(attacker.exp == 10000)
                        {
                            attacker.exp +=1;
                            //attacker.level = 'Max Level';
                        }

                    }

                    // player respawn, health reset to max
                    plyr.hp = plyr.maxHp;
                    // spawns the player at a random x and y position, have set it so
                    // they spawn closer to the middle of the mapp and not the edges
                    plyr.x = Math.floor(Math.random() * 701) + 300;
                    plyr.y = Math.floor(Math.random() * 701) + 300;
                }
                // remove bullet if it hits
                self.toRemove = true;
            }
        }
    }

   // get bullet init pack
    self.getInitPack = function() {
        return{
            id: self.id,
            x: self.x,
            y: self.y
        };


    }

    // get refreshed pack
    self.getRefreshedPack = function () {
        return{
            id: self.id,
            x: self.x,
            y: self.y
        };
    }

    //add bullet to list
    Bullet.list[self.id] = self;
    // add player variable to the bullet initpack var
    initPack.bullet.push(self.getInitPack());
    return self;
}

Bullet.list = {};

// get all initPacks
Bullet.getInitPacks = function() {
    var bullets = [];
    for(var i in Bullet.list)
        bullets.push(Bullet.list[i].getInitPack());
    return bullets;
}

// function to return refreshed pack
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

// socket connection
io.sockets.on('connection', function (socket){
        console.log('socket connection');
    // set the socket.id as a random number
    socket.id = Math.random();
    // add socket to socket list
    socketList[socket.id] = socket;

    // call player on connect function, using the socket as param
    Player.onConnect(socket);

    // return all of the active sockets
    console.log(Object.keys(socketList));



    // recieves and send messages from the chatbox to the client
    socket.on('send message', function (data){
        io.sockets.emit('new message', data );
    });
        // on socket disconnect
        socket.on('disconnect', function(){

            // delete the socket from the socket list
            delete socketList[socket.id];
            // call the disconnect function using socket as param
            Player.onDisconnect(socket);
            console.log("player disconnected");
        });
});


// create var to hold the initpack data and the remove pack data
var initPack = {player:[], bullet:[]};
var removePack = {player:[], bullet:[]};

// set the interval to 40 ms
setInterval(function(){

    // pack holds the player refreshed pack and bullet refreshed pack
    var pack = {
        player:Player.refresh(),
        bullet:Bullet.refresh()
    }

    // loop through all the sockets and send the init, refresh and remove packs to the client
    for(var i in socketList){
        var socket = socketList[i];
        socket.emit('init', initPack);
        socket.emit('refresh', pack);
        socket.emit('remove', removePack);

    }
    // empty player and bullet init and remove pack at the ened of every interval
    initPack.player = [];
    initPack.bullet = [];
    removePack.player = [];
    removePack.bullet = [];

}, 1000/25);




