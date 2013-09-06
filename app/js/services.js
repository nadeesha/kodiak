'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
var services = angular.module('kodiak.services', []);

/* Constants */
// services.constant('SERVER_URL', 'http://localhost:3000');
services.factory('userService', ['$rootScope', '$localStorage', '$http', 'GRIZZLY_URL', function ($rootScope, $localStorage, $http, GRIZZLY_URL) {

    var service = {

        model: {
            firstName: '',
            lastName: '',
            email: '',
            access_token: '',
            expiration: ''
        },

        saveState: function () {
            $localStorage.$default.user = angular.toJson(service.model);
        },

        restoreState: function () {
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
        	}).success(function (data, status, headers, config) {
        		callback();
        	}).error(function (data, status, headers, config) {
        		callback(status);
        	});
        }
    }

    return service;
}]);