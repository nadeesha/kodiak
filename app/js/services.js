'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
var services = angular.module('kodiak.services', []);

/* Constants */
// services.constant('SERVER_URL', 'http://localhost:3000');
services.factory('userService', ['$rootScope', '$localStorage', '$http', 'GRIZZLY_URL', function($rootScope, $localStorage, $http, GRIZZLY_URL) {

    var service = {

        model: {
            firstName: '',
            lastName: '',
            email: '',
            access_token: '',
            expiration: ''
        },

        authHeader: function() {
            if (!service.model.header || service.model.expiration < new Date()) {
                console.log('redirect to login'); //TODO:
            }

            var header = {
                access_token: service.model.access_token
            };

            return header;
        },

        saveState: function() {
            $localStorage.$default.user = angular.toJson(service.model);
        },

        restoreState: function() {
            service.model = angular.fromJson(sessionStorage.userService);
        },

        create: function(user, callback) {
            $http.put(GRIZZLY_URL + '/user/create', {
                "firstName": user.firstName,
                "lastName": user.lastName,
                "email": user.email,
                "password": user.password
            }).success(function(data, status, headers, config) {
                service.model.firstName = user.firstName;
                service.model.lastName = user.lastName;
                service.model.email = user.email;
                service.saveState();

                callback();
            }).error(function(data, status, headers, config) {
                callback(status);
            });
        },

        login: function(user, callback) {
            $http.put(GRIZZLY_URL + '/user/token/create', {
                "email": user.email,
                "password": user.password
            }).success(function(data, status, headers, config) {
                service.model.email = user.email;
                service.model.access_token = data.access_token;
                service.model.expiration = data.expiration;
                service.saveState();

                callback();
            }).error(function(data, status, headers, config) {
                callback(status);
            });
        },

        activate: function(user, callback) {
            var email = encodeURIComponent(user.email),
                token = encodeURIComponent(user.token);

            $http.post(GRIZZLY_URL + '/user/activate', {
                "email": email,
                "token": token
            }).success(function(data, status, headers, config) {
                callback();
            }).error(function(data, status, headers, config) {
                callback(status);
            });
        },

        get_profile: function(callback) {
            $http.get(GRIZZLY_URL + '/user/profile', service.authHeader()).success(function(data, status, headers, config) {
                callback(null, data.profile);
            }).error(function(data, status, headers, config) {
                callback(data, null);
            });
        },

        set_profile: function(profile, callback) {
            $http.post(GRIZZLY_URL + '/user/profile', profile, service.authHeader()).success(function(data, status, headers, config) {
                callback();
            }).error(function(data, status, headers, config) {
                callback(data);
            })
        }
    }

    return service;
}]);

services.factory('notificationService', ['$http', function($http) {
    return {
        notify: function(hash) {
            $.pnotify(hash);
        }
    };
}]);
