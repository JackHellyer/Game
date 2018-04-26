angular.module('Game', [
    'ngAnimate',
    'app.routes',
    'authService',
    'mainCtrl',
    'userCtrl',
    'userService',
    'gameCtrl'
])

// application configuration to integrate token into requests
    .config(function($httpProvider) {

        // attach our auth interceptor to the http requests
        $httpProvider.interceptors.push('AuthInterceptor');

    });