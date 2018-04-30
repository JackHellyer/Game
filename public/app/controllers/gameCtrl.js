angular.module('gameCtrl', [])

    .controller('gameController', function(Auth) {

        var vm = this;
        var socket = io();
        jQuery(function ($) {

            var $messageForm = $('#send-message');
            var $messageBox = $('#message');
            var $chat = $('#chat');
            //var $username =

            Auth.getUser()
                .then(function (data) {
                    vm.user = data.data;
                    $messageForm.submit(function (e) {
                        //console.log($messageBox.val());
                        e.preventDefault();
                        socket.emit('send message', vm.user.username + ": " + $messageBox.val());
                        $messageBox.val('');
                    });

                    socket.on('new message', function (data) {
                        $chat.animate({scrollTop: $chat.prop("scrollHeight")}, 500);
                        $chat.append(data + "<br/>");


                    });

                });



        });

        //init

        //refresh


        //remove




        if(document.getElementById("ctx") != null)
        {
            var WIDTH = 500;
            var HEIGHT = 500;

            var Img = {};

            Img.player = new Image();
            Img.player.src = 'assets/img/robot.png';


            Img.bullet = new Image();
            Img.bullet.src = 'assets/img/Bullet_000.png';

            Img.map = new Image();
            Img.map.src = 'assets/img/map.png'

            var canvas = document.getElementById("ctx").getContext('2d');
            //canvas.background = "blue";
            canvas.font = '30px Arial';


            var Player = function(initPack){
                var self = {};
                self.id = initPack.id;
                self.number = initPack.number;
                self.x = initPack.x;
                self.y = initPack.y;
                self.hp = initPack.hp;
                self.maxHp = initPack.maxHp;
                self.exp = initPack.exp;
                self.level = initPack.level;



                self.drawPlayer = function() {

                    var x = self.x - Player.list[selfId].x + WIDTH/2;
                    var y = self.y - Player.list[selfId].y + HEIGHT/2;

                    hpBarWidth = 30 * self.hp/self.maxHp;
                    canvas.fillStyle = "red";
                    canvas.fillRect(x - hpBarWidth/2, y - 40, hpBarWidth, 4);
                    canvas.fillStyle = "#000000"
                    var width = Img.player.width/6 ;
                    var height = Img.player.height /6;

                    var x = self.x - Player.list[selfId].x + WIDTH/2;
                    var y = self.y - Player.list[selfId].y + HEIGHT/2;

                    /*if(self.x >= 250 && self.x < 1250 && self.y >= 250 && self.y < 1150)
                    {*/
                        canvas.drawImage(Img.player,0,0, Img.player.width, Img.player.height, x-width/2, y-height/2,width, height);


                    //}



                    //canvas.fillText(self.number, self.x, self.y);


                    // exp
                    //canvas.fillText(self.exp, self.x, self.y - 40);
                }

                Player.list[self.id] = self;

                return self;
            }
            Player.list = {};

            var Bullet = function(initPack){
                var self = {};
                self.id = initPack.id;
                self.x = initPack.x;
                self.y = initPack.y;

                self.draw = function() {

                    var width = Img.bullet.width /6;
                    var height = Img.bullet.height /6;

                    var x = self.x - Player.list[selfId].x + WIDTH/2;
                    var y = self.y - Player.list[selfId].y + HEIGHT/2;

                    //canvas.fillRect(self.x-5, self.y-5, 10,10);
                    canvas.drawImage(Img.bullet,0,0, Img.bullet.width, Img.bullet.height, x-width/2, y-height/2,width, height);

                }

                Bullet.list[self.id] = self;
                return self;

            }
            Bullet.list = {};

            var selfId = null;

            socket.on('init', function(data){
                //console.log(data.selfId);
                //console.log(data);
                if(data.selfId)
                    selfId = data.selfId;


                for(var i = 0; i < data.player.length; i++)
                {
                    new Player(data.player[i]);
                }

                for(var i=0; i < data.bullet.length; i++)
                {
                    new Bullet(data.bullet[i]);
                }
            });

            socket.on('refresh', function(data){
                for(var i = 0; i < data.player.length; i++)
                {
                    var pack = data.player[i];
                    var p = Player.list[pack.id];
                    if(p)
                    {
                        if(pack.x !== undefined)
                            p.x = pack.x;
                        if(pack.y !== undefined)
                            p.y = pack.y;
                        if(pack.hp !== undefined)
                            p.hp = pack.hp;
                        if(pack.exp !== undefined)
                            p.exp = pack.exp;
                    }
                }

                for(var i = 0; i < data.bullet.length; i++)
                {
                    var pack = data.bullet[i];
                    var b = Bullet.list[pack.id];
                    if(b)
                    {
                        if(pack.x !== undefined)
                            b.x = pack.x;
                        if(pack.y !== undefined)
                            b.y = pack.y;
                    }
                }
            });


            socket.on('remove', function(data){
                for(var i = 0; i < data.player.length; i++)
                {
                    delete Player.list[data.player[i]];
                }
                for(var i = 0; i < data.bullet.length; i++)
                {
                    delete Bullet.list[data.bullet[i]];
                }
            });


            setInterval(function(){

                if(!selfId)
                    return;
                canvas.clearRect(0,0,500,500);
                drawMap();
                drawPlayerLevel();
                //canvas.rect(300,350,1200,900);
                //canvas.stroke();
                for(var i in Player.list)
                {

                    Player.list[i].drawPlayer();
                }
                for(var i in Bullet.list)
                {
                    Bullet.list[i].draw();
                }



            }, 40);

            var drawMap = function () {
                var width = Img.map.width *3;
                var height = Img.map.height *3;

                var x = WIDTH/2 - Player.list[selfId].x;
                var y = HEIGHT/2 - Player.list[selfId].y;

                canvas.drawImage(Img.map,x,y,width, height);

            }

            var drawPlayerLevel = function () {
                var exp = Player.list[selfId].exp;
                var level = Player.list[selfId].level;
                canvas.fillStyle = 'white';
                console.log(Player.list[selfId].level);
                canvas.fillText('Level ' + level + ' Current EXP: ' + exp, 0,30);




            }

            /*socket.on('newPositions', function(data){
                canvas.clearRect(0,0,500,500);
                for( var i = 0; i < data.player.length; i++)
                {
                    canvas.fillText(data.player[i].number, data.player[i].x, data.player[i].y);

                }

                for( var i =0; i < data.bullet.length; i++)
                {
                    canvas.fillRect(data.bullet[i].x-5, data.bullet[i].y-5, 10,10);
                }


            });*/

            document.onkeydown = function(event) {

                if(event.keyCode === 68) // right press, D key
                    socket.emit('keyPress', {input:'right', state: true});
                else if(event.keyCode === 83) // down press, s key
                    socket.emit('keyPress', {input:'down', state: true});
                else if(event.keyCode === 65) // left press, a key
                    socket.emit('keyPress', {input:'left', state: true});
                else if(event.keyCode === 87) // up press, w key
                    socket.emit('keyPress', {input:'up', state: true});


            }

            document.onkeyup = function(event) {

                if(event.keyCode === 68) // right press, D key
                    socket.emit('keyPress', {input:'right', state: false});
                else if(event.keyCode === 83) // down press, s key
                    socket.emit('keyPress', {input:'down', state: false});
                else if(event.keyCode === 65) // left press, a key
                    socket.emit('keyPress', {input:'left', state: false});
                else if(event.keyCode === 87) // up press, w key
                    socket.emit('keyPress', {input:'up', state: false});

            }

            document.onmousedown = function(event) {
                socket.emit('keyPress',{input:'attack',state:true});
            }

            document.onmouseup = function(event) {
                socket.emit('keyPress', {input:'attack', state: false});
            }

            document.onmousemove = function(event) {
                var x = -250 + event.clientX - 8;
                var y = -250 + event.clientY - 8;
                var angle = Math.atan2(y,x) / Math.PI * 180;
                socket.emit('keyPress',{input:'mouseAngle',state:angle});
            }


        }

    });
