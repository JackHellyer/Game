angular.module('userService',[ ])

    .factory('User', function($http) {

        // create new object
        var userFactory = {};

        // get single user
        userFactory.get = function(id) {
            return $http.get('/api/users/' + id);
        };

        //get all users
        userFactory.all = function() {
            return $http.get('/api/users/');
        };

        // create a user
        userFactory.create = function(userData) {
            return $http.post('/api/users/', userData);
        };

        // update a user
        userFactory.update = function(id, userData) {
            return $http.put('/api/users/' + id, userData);
        };




        //return our entire userFactory object
        return userFactory;
    });
