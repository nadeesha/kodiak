angular.module('kodiak').controller('LoginCtrl', function ($scope, $http,
    $location, userService, notificationService, $rootScope, $state, $stateParams,
    validationService, Facebook) {

    'use strict';

    $scope.user = {};

    if ($stateParams.to) {
        notificationService.handleInfo('You need to login first.');
    }

    $scope.$watch('user.rememberMe', function (remembered) {
        if (remembered) {
            notificationService.handleInfo('Please do not select this option if other people use this device.', 'Warning!');
        }
    });

    $scope.login = function (credentials) {
        if (!credentials || !credentials.email || !credentials.password) {
            credentials.email = $('#login-email').val();
            credentials.password = $('#login-password').val();
        }

        try {
            validationService.mustBeTrue(credentials.email, 'E-mail should be a valid e-mail address');
            validationService.mustBeTrue(credentials.password, 'Password is required');
        } catch (e) {
            return;
        }

        userService.login(credentials, function (err, data) {
            if (!err) {
                $rootScope.$broadcast('refreshNotifications');

                if ($stateParams.to) {
                    $location.url(decodeURIComponent($stateParams.to));
                } else if (data.affiliation) {
                    $state.go('organizationDashboard');
                } else {
                    $state.go('viewProfile');
                }
            } else if (err === 401) {
                notificationService.notify({
                    title: 'Invalid e-mail address/password!',
                    text: 'Please try again',
                    type: 'error',
                    hide: true
                });
            } else if (err === 403) {
                notificationService.notify({
                    title: 'Account is inactive!',
                    text: 'This account is currently inactive. If you just signed up, please ' + 'click the activation link we sent to your email.',
                    type: 'error',
                    hide: true
                });
            }
        });
    };

    $scope.fbLogin = function () {
        Facebook.login(function (authResponse) {
            userService.login(authResponse, 'facebook', function (statusCode, data) {
                if (statusCode === 400 && data.code === 'FB_NOT_CREATED') {
                    notificationService.handleInfo('Please wait... we are creating your account.');
                    userService.createViaFacebook(authResponse)
                        .success(function () {
                            userService.login(authResponse, 'facebook', function () {
                                $state.go('viewProfile');
                            });
                        });
                } else {
                    if ($stateParams.to) {
                        $location.url(decodeURIComponent($stateParams.to));
                    } else {
                        $state.go('viewProfile');
                    }
                }
            });
        }, {
            scope: 'email'
        });
    };
});