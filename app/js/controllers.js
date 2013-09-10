'use strict';

/* Controllers */

var controllers = angular.module('kodiak.controllers', ['kodiak.configs']);

controllers.controller('SignupCtrl', ['$scope', '$http', '$location', 'userService', 'notificationService',
function($scope, $http, $location, userService, notificationService) {
    $scope.create = function(user) {
        userService.create(user, function(err) {
            if (!err) {
                notificationService.notify({
                    title: 'Account created!',
                    text: 'But before you begin, check your e-mail inbox and click the confirmation link, please.',
                    type: 'success',
                    hide: false
                });
            }
            else if (err === 409) {
                notificationService.notify({
                    title: 'Account already exists!',
                    text: 'We already have an account for ' + user.email + '. Please <a href="#/login/">log in</a> to your account instead.',
                    type: 'error',
                    hide: true
                });
            }
            else {
                $location.url('/500');
            }
        });
    };
}]);

controllers.controller('LoginCtrl', ['$scope', '$http', '$location', 'userService', 'notificationService',

function($scope, $http, $location, userService, notificationService) {
    $scope.validate = function(user) {
        userService.login(user, function(err) {
            if (!err) {
                $location.url('/me');
            }
            else if (err === 401) {
                notificationService.notify({
                   title: 'Invalid e-mail address/password!',
                   text: 'Please try again',
                   type: 'error',
                   hide: true
                });
            }
            else if (err === 403) {
                notificationService.notify({
                   title: 'Account is inactive!',
                   text: 'This account is currently inactive. If you just signed up, please click the activation link we sent to your email.',
                   type: 'error',
                   hide: false
                });
            }
            else {
                $location.url('/500');
            }
        });
    };
}]);

controllers.controller('ActivateCtrl', ['$scope', '$http', '$location', 'userService',

function($scope, $http, $location, userService) {
    $scope.response = {
        incorrect: false,
        success: false
    };
    var user = {
        email: ($location.search()).email,
        token: ($location.search()).token
    };

    userService.activate(user, function(err) {
        if (!err) {
            $scope.response.incorrect = false;
            $scope.response.success = true;
        }
        else if (err === 400) {
            $scope.response.incorrect = false;
            $scope.response.success = true;
        }
        else {
            $location.url('/500');
        }
    });
}]);

controllers.controller('MeCtrl', ['$scope', '$http', '$location', 'userService', 'notificationService',
function($scope, $http, $location, userService, notificationService) {
    userService.get_profile(function(err, user) {
        if (!err) {
            $scope.user = user;
        }
        else if (err) {
            $location.url('/500');
        }
    });
}]);