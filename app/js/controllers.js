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
                } else if (err === 409) {
                    notificationService.notify({
                        title: 'Account already exists!',
                        text: 'We already have an account for ' + user.email + '. Please <a href="#/login/">log in</a> to your account instead.',
                        type: 'error',
                        hide: true
                    });
                } else {
                    $location.url('/500');
                }
            });
        };
    }
]);

controllers.controller('LoginCtrl', ['$scope', '$http', '$location', 'userService', 'notificationService',
    function($scope, $http, $location, userService, notificationService) {
        $scope.validate = function(user) {
            userService.login(user, function(err) {
                if (!err) {
                    $location.url('/me');
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
                        text: 'This account is currently inactive. If you just signed up, please click the activation link we sent to your email.',
                        type: 'error',
                        hide: true
                    });
                } else {
                    $location.url('/500');
                }
            });
        };
    }
]);

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
            } else if (err === 400) {
                $scope.response.incorrect = false;
                $scope.response.success = true;
            } else {
                $location.url('/500');
            }
        });
    }
]);

controllers.controller('MeCtrl', ['$scope', '$http', '$location', '$modal', 'userService', 'notificationService',
    function($scope, $http, $location, $modal, userService, notificationService) {
        userService.getProfile(function(err, user) {
            if (!err) {
                $scope.user = user;
            } else if (err) {
                $location.url('/500');
            }
        });

        $scope.saveProfile = function() {
            userService.saveProfile($scope.user, function(err) {
                if (err) {
                    notificationService.notify({
                        title: 'Error occured!',
                        text: 'We could not save the final changes made to your profile.',
                        type: 'error',
                        hide: true
                    });
                }
                else {
                    notificationService.notify({
                        title: 'Changed saved!',
                        text: 'Successfully saved changes made to your profile.',
                        type: 'success',
                        hide: true
                    });
                }
            })
        }

        // personal modal
        $scope.openPersonalModal = function(profile) {
            var personalModal = $modal.open({
                templateUrl: 'modal_me_personal.html',
                controller: PersonalModalInstanceCtrl,
                resolve: { // we're sending these data from this controller to the modeal's controller
                    data: function() {
                        return {
                            location: profile.location,
                            contactNumbers: profile.contactNumbers,
                            languages: profile.languages,
                            nationalIdentifier: profile.nationalIdentifier,
                            dateOfBirth: profile.dateOfBirth
                        };
                    }
                }
            });

            personalModal.result.then(function(personalData) { // when the modal returns a result
                profile.location = personalData.location;
                profile.contactNumbers = personalData.contactNumbers;
                profile.languages = personalData.languages;
                profile.nationalIdentifier = personalData.nationalIdentifier;
                profile.dateOfBirth = personalData.dateOfBirth;

                $scope.saveProfile();
            });
        }

        // qualification modal
        $scope.openQualificationModal = function(qualification) {
            var qualificationModal = $modal.open({
                templateUrl: 'modal_me_qualification.html',
                resolve: {
                    data: function() {
                        return qualification;
                    }
                }
            });

            qualificationModal.result.then(function(qualificationData) {
                qualification = qualificationData;
            });
        }

        // tenure modal
        $scope.openTenureModal = function(tenure) {
            var tenureModal = $modal.open({
                templateUrl: 'modal_me_tenure.html',
                resolve: {
                    data: function() {
                        return tenure;
                    }
                }
            });

            tenureModal.result.then(function(tenureData) {
                tenure = tenureData;
            });
        }

        // skills modal
        $scope.openSkillModal = function(skill) {
            var skillModal = $modal.open({
                templateUrl: 'modal_me_skill.html',
                resolve: {
                    data: function() {
                        return skill;
                    }
                }
            });

            skillModal.result.then(function(skillData) {
                skill = skillData;
            });
        }

    }
]);

var PersonalModalInstanceCtrl = function($scope, data) {
    $scope.data = data;
};
