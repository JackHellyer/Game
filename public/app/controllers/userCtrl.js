angular.module('userCtrl', ['userService'])

    .controller('userController', function(User) {


        var vm = this;

        vm.processing = true;

        // grab all the users at page load
        User.all()
            .then(function(data) {

                // when all the users come back remove the processing variable
                vm.processing = false;

                // bind the users that come back to vm.users
                vm.users = data.data;
                console.log(vm.users);
            });

        // function to delete user
        vm.deleteUser = function(id) {
            vm.processing = true;

            // accept the user id as a parameter
            User.delete(id)
                .then(function(data) {

                    // get all the users to update the table
                    // you can also set up your api
                    // to return a list of user with the delete call

                    User.all()
                        .then(function(data) {
                            vm.processing = false;
                            vm.users = data;
                        });
                });
        };

    })

    .controller('userCreateController', function(User, $location) {

        var vm = this;

        // variable to hide/show elements of the view

        // differentiates between create or edit pages



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

                    //$location.path('/');
                    vm.userData = {};
                }, function(){

                    vm.message = data.message;
                });

        };
    })
