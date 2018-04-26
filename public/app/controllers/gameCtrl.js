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

            var canvas = document.getElementById("ctx").getContext('2d');
            canvas.font = '30px Arial';

            var Player = function(initPack){
                var self = {};
                self.id = initPack.id;
                self.number = initPack.number;
                self.x = initPack.x;
                self.y = initPack.y;
                Player.list[self.id] = self;

                return self;
            }
            Player.list = {};

            var Bullet = function(initPack){
                var self = {};
                self.id = initPack.id;
                self.x = initPack.x;
                self.y = initPack.y;
                Bullet.list[self.id] = self;
                return self;

            }
            Bullet.list = {};

            socket.on('init', function(data){
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
                canvas.clearRect(0,0,500,500);

                for(var i in Player.list)
                {
                    canvas.fillText(Player.list[i].number, Player.list[i].x, Player.list[i].y);

                }
                for(var i in Bullet.list)
                {
                    canvas.fillRect(Bullet.list[i].x-5, Bullet.list[i].y-5, 10,10);
                }
            }, 40);

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
