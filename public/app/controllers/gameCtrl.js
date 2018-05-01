angular.module('gameCtrl', [])

    .controller('gameController', function(Auth, $routeParams, User) {

        var vm = this;
        var socket = io();

        // function to emit and recieve the chat box message from the server
        jQuery(function ($) {

            var $messageForm = $('#send-message');
            var $messageBox = $('#message');
            var $chat = $('#chat');

            // get currently loagged in user
            Auth.getUser()
                .then(function (data) {
                    vm.user = data.data;
                    // on pressing submit send message with username
                    $messageForm.submit(function (e) {
                        //console.log($messageBox.val());
                        e.preventDefault();
                        socket.emit('send message', vm.user.username + ": " + $messageBox.val());
                        // empty the messageBox
                        $messageBox.val('');
                    });

                    // recieve messages from the server
                    socket.on('new message', function (data) {
                        // automatically moves to the bottom of the scroll when there is a new message
                        $chat.animate({scrollTop: $chat.prop("scrollHeight")}, 500);
                        // add messages to the chat box
                        $chat.append(data + "<br/>");


                    });

                });


        });

        // if the canvas is not empty
        if (document.getElementById("ctx") != null) {
            // constant width and height
            var WIDTH = 500;
            var HEIGHT = 500;

            // image object
            var Img = {};

            // new image object and source
            Img.player = new Image();
            Img.player.src = 'assets/img/player1.png';

            // new image object and source
            Img.bullet = new Image();
            Img.bullet.src = 'assets/img/Bullet_000.png';

            // new image object and source
            Img.map = new Image();
            Img.map.src = 'assets/img/map.png'

            // get the canvas id and set the context to '2 dimensions
            var canvas = document.getElementById("ctx").getContext('2d');

            // set canvas text font
            canvas.font = '30px Arial';

        // Player object that takes in a initPack from the server
        var Player = function (initPack) {
            var self = {};

            // set the players variables
            self.id = initPack.id;
            self.number = initPack.number;
            self.x = initPack.x;
            self.y = initPack.y;
            self.hp = initPack.hp;
            self.maxHp = initPack.maxHp;
            self.exp = initPack.exp;
            self.level = initPack.level;

            // draw player on the canvas function
            self.drawPlayer = function () {

                // set x and y to the
                var x = self.x - Player.list[selfId].x + WIDTH / 2;
                var y = self.y - Player.list[selfId].y + HEIGHT / 2;

                //set the health bar width
                hpBarWidth = 30 * self.hp / self.maxHp;
                //set the health bar to red
                canvas.fillStyle = "red";
                // draw the hp bar
                canvas.fillRect(x - hpBarWidth / 2, y - 40, hpBarWidth, 4);
                //canvas.fillStyle = "#000000"

                    // decreasing the size of the player
                    var width = Img.player.width / 6;
                    var height = Img.player.height / 6;

                    //draw player
                    canvas.drawImage(Img.player, 0, 0, Img.player.width, Img.player.height, x - width / 2, y - height / 2, width, height);




            }

            //add the created player to the player list
            Player.list[self.id] = self;

            return self;
        }
        Player.list = {};


        // bullet object
        var Bullet = function (initPack) {
            //set the bullet variables id, x coordinate, y coordinate
            var self = {};
            self.id = initPack.id;
            self.x = initPack.x;
            self.y = initPack.y;

            // function to draw the bullet
            self.draw = function () {

                //decrease the size of the bullets
                var width = Img.bullet.width / 6;
                var height = Img.bullet.height / 6;

                // set the x and y of where the bullets are shot from
                var x = self.x - Player.list[selfId].x + WIDTH / 2;
                var y = self.y - Player.list[selfId].y + HEIGHT / 2;

                // draw bullets
                canvas.drawImage(Img.bullet, 0, 0, Img.bullet.width, Img.bullet.height, x - width / 2, y - height / 2, width, height);

            }
            // add the created bullet to the bullet list
            Bullet.list[self.id] = self;
            return self;

        }
        Bullet.list = {};

        // selfId gets the playing player
        var selfId = null;

            // recieve data from the server
        socket.on('init', function (data) {
            // if a player exists
            if (data.selfId)
                // assign the ID, which will be the socket.id
                selfId = data.selfId;

            // loop through all the active players ad create new player objects
            for (var i = 0; i < data.player.length; i++) {
                new Player(data.player[i]);
            }
            // loop through all the active bullets and create new bullet objects
            for (var i = 0; i < data.bullet.length; i++) {
                new Bullet(data.bullet[i]);
            }
        });


        //recieve updated data from the server
        socket.on('refresh', function (data) {
            // loop through all the active players and get their current positions
            for (var i = 0; i < data.player.length; i++) {
                var pack = data.player[i];
                var p = Player.list[pack.id];
                // check to make sure updated positions aren't undefined and then allocate the new value
                if (p) {
                    if (pack.x !== undefined)
                        p.x = pack.x;
                    if (pack.y !== undefined)
                        p.y = pack.y;
                    if (pack.hp !== undefined)
                        p.hp = pack.hp;
                    if (pack.exp !== undefined)
                        p.exp = pack.exp;
                    if (pack.level !== undefined)
                        p.level = pack.level;
                }
            }
            // loop through all the active bullets and get their current positions
            for (var i = 0; i < data.bullet.length; i++) {
                var pack = data.bullet[i];
                var b = Bullet.list[pack.id];
                // check to make sure updated positions aren't undefined and then allocate the new value
                if (b) {
                    if (pack.x !== undefined)
                        b.x = pack.x;
                    if (pack.y !== undefined)
                        b.y = pack.y;
                }
            }
        });

        // remove active items from the player and bullet lists when they close the website
            socket.on('remove', function (data) {
                for (var i = 0; i < data.player.length; i++) {

                    delete Player.list[data.player[i]];
                }
                for (var i = 0; i < data.bullet.length; i++) {
                    delete Bullet.list[data.bullet[i]];
                }
            });

        // draw the objects in their new positions every 40 ms
        setInterval(function () {
            // if there isn't any players do nothing,
            // this prevents a warning message as the game will try to write the score even
            // if there isn't any players online
            if (!selfId)
                return;
            // clear the rectangle, so the new postiions can be displayed
            canvas.clearRect(0, 0, 500, 500);
            // call the draw map function
            drawMap();
            // call the draw player level function
            drawPlayerLevel();
            //code below was going to to draw a rectangle to show the boundry, but didn't work
            // the rectangle was moving with the player
            //canvas.rect(300,350,1200,900);
            //canvas.stroke();
            // draw all the players
            for (var i in Player.list) {

                Player.list[i].drawPlayer();
            }
            // draw all the bullets
            for (var i in Bullet.list) {
                Bullet.list[i].draw();
            }

        // set the time interval to 40 ms
        }, 40);

        var drawMap = function () {
            // multiple the hieght and width of the map by 3
            var width = Img.map.width * 3;
            var height = Img.map.height * 3;

            // draw the map around the player
            var x = WIDTH / 2 - Player.list[selfId].x;
            var y = HEIGHT / 2 - Player.list[selfId].y;

            // draw map
            canvas.drawImage(Img.map, x, y, width, height);

        }

        var drawPlayerLevel = function () {
            // get the current player exp
            var exp = Player.list[selfId].exp;
            // get the currentl players level
            var level = Player.list[selfId].level;
            // set colour to white
            canvas.fillStyle = 'white';
            // draw the level and exp in the top left corner of the canvas
            canvas.fillText('Level ' + level + ' Current EXP: ' + exp, 0, 30);


        }

        // send user control inputs to the server mosue jey down (pressing a key)
        document.onkeydown = function (event) {

            if (event.keyCode === 68) // right press, D key
                socket.emit('keyPress', {input: 'right', state: true});
            else if (event.keyCode === 83) // down press, s key
                socket.emit('keyPress', {input: 'down', state: true});
            else if (event.keyCode === 65) // left press, a key
                socket.emit('keyPress', {input: 'left', state: true});
            else if (event.keyCode === 87) // up press, w key
                socket.emit('keyPress', {input: 'up', state: true});


        }



        // send user control inputs to the server, mouse key up(release key)
        document.onkeyup = function (event) {

            if (event.keyCode === 68) // right press, D key
                socket.emit('keyPress', {input: 'right', state: false});
            else if (event.keyCode === 83) // down press, s key
                socket.emit('keyPress', {input: 'down', state: false});
            else if (event.keyCode === 65) // left press, a key
                socket.emit('keyPress', {input: 'left', state: false});
            else if (event.keyCode === 87) // up press, w key
                socket.emit('keyPress', {input: 'up', state: false});

        }

        // send the player mouse clicks to te server
        document.onmousedown = function (event) {
            socket.emit('keyPress', {input: 'attack', state: true});
        }
        // send the player release the mouse clicks
        document.onmouseup = function (event) {
            socket.emit('keyPress', {input: 'attack', state: false});
        }
        // send the mouse postion to the server, used to work out the angle the bullet is shot from
        document.onmousemove = function (event) {
            // get the x and y of the middle of the canvas
            var x = -250 + event.clientX - 8;
            var y = -250 + event.clientY - 8;
            // works out the angle
            var angle = Math.atan2(y, x) / Math.PI * 180;
            socket.emit('keyPress', {input: 'mouseAngle', state: angle});
        }


        }

    });
