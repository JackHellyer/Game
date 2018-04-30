angular.module('userCtrl', ['userService'])

    .controller('userCreateController', function(User, $location) {

        var vm = this;


        // function to create user
        vm.saveUser = function() {

            vm.processing = true;

            // clear the message
            vm.message = '';

            // use the create function in the userService
            User.create(vm.userData)
                .success(function(data) {
                    vm.processing = false;

                    vm.message = data.message;


                    vm.userData = {};
                }, function(){

                    vm.message = data.message;
                });

        };
    })
