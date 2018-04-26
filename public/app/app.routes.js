angular.module('app.routes', ["ngRoute"])

    .config(function($routeProvider, $locationProvider) {

        $routeProvider

        // home page route
            .when('/', {
                templateUrl: 'app/views/pages/home.html',
                controller: 'mainController',
                controllerAs: 'login'
            })

            .when('/createUser', {
                templateUrl: 'app/views/pages/createUser.html',
                controller: 'userCreateController',
                controllerAs: 'user'
            })

            .when('/game', {
                templateUrl: 'app/views/pages/game.html',
                controller: 'gameController',
                controllerAs: 'game'
                //access: {restricted: true}

            })



        $locationProvider.html5Mode(true);
    });