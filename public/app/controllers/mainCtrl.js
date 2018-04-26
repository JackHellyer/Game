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













        // function to handle logout

        vm.doLogout = function() {
            Auth.logout();
            vm.user = '';
            //vm.user = {};

            $location.path('/');
        };





    });