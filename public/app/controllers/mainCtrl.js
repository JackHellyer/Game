angular.module('mainCtrl', [])

    .controller('mainController', function($rootScope, $location, Auth) {

        //ctx.style.display = 'none';
        var vm = this;

        //vm.processing = true;

        // get info if a person is logged in
        vm.loggedIn = Auth.isLoggedIn();

        // check to see if a user is logged in on every request
        $rootScope.$on('$routeChangeStart', function() {

            vm.loggedIn = Auth.isLoggedIn();

            // get user info on page load
            Auth.getUser()
                .then(function(data) {
                    vm.user = data.data;

                });
        });

        // functioon to handle login form

        vm.doLogin = function() {
            //vm.processing = true;

            // clear the error
            vm.error = '';

            Auth.login(vm.loginData.username, vm.loginData.password)
                .then(function(data) {
                    vm.processing = false;

                    // if a user successfully logs in, redirect to users page
                    if(data.success)
                        $location.path('/game');
                    else
                        vm.error =  data.message;
                });
        };

        var socket = io.connect();
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


        if(document.getElementById("ctx") != null)
        {
            //var socket = io.connect();
            //ctx.style.display = 'true';
            var canvas = document.getElementById("ctx").getContext('2d');
            //var ctx  = canvas;
            //var canvas = ctx.getContext("2d");
            canvas.font = '30px Arial';
            //var socket = io();
            socket.on('newPositions', function(data){
                canvas.clearRect(0,0,500,500);
                for( var i = 0; i < data.length; i++)
                {
                    canvas.fillText('P', data[i].x, data[i].y);

                }


            });
        }











        // function to handle logout

        vm.doLogout = function() {
            Auth.logout();
            vm.user = '';
            //vm.user = {};

            $location.path('/');
        };





    });