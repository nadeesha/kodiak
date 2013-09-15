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
                } else {
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
                templateUrl: 'partials/modal_me_personal.html',
                controller: PersonalModalInstanceCtrl,
                resolve: { // we're sending these data from this controller to the modeal's controller
                    data: function() {
                        return {
                            location: profile.location,
                            contactNumber: profile.contactNumber,
                            languages: profile.languages,
                            nationalIdentifier: profile.nationalIdentifier,
                            dateOfBirth: profile.dateOfBirth
                        };
                    }
                }
            });

            personalModal.result.then(function(personalData) { // when the modal returns a result
                profile.location = personalData.location;
                profile.contactNumber = personalData.contactNumber;
                profile.languages = personalData.languages;
                profile.nationalIdentifier = personalData.nationalIdentifier;
                profile.dateOfBirth = new Date(personalData.dateOfBirth);

                $scope.saveProfile();
            });
        }

        var bindAddEditModal = function (obj, templateUrl, instanceController, collection) {
            var add = !obj; // add = true if this is a new aulification vs. an edit 

            var modal = $modal.open({
                templateUrl: templateUrl,
                controller: instanceController,
                resolve: {
                    data: function() {
                        // if it's "adding", pass the new object to the child scope
                        // else, return the existing "obj"
                        if (add) {
                            return new Object();
                        }
                        else {
                            return obj;    
                        }
                    }
                }
            });

            // when the user has clicked ok, either push the "new" object here
            // or change the existing object in the main scope
            modal.result.then(function(altered) {
                if (add) {
                    collection.push(altered);
                }
                else {
                    obj = altered;
                }
                
                $scope.saveProfile();
            });
        }

        // qualification modal
        $scope.openQualificationModal = function(qualification) {
            bindAddEditModal(qualification, 'partials/modal_me_qualification.html', QualificationTenureModalInstanceCtrl, $scope.user.qualifications);
        }

        // tenure modal
        $scope.openTenureModal = function(tenure) {
            bindAddEditModal(tenure, 'partials/modal_me_tenure.html', QualificationTenureModalInstanceCtrl, $scope.user.tenures);
        }

        // skills modal
        $scope.openSkillModal = function(skill) {
            bindAddEditModal(skill, 'partials/modal_me_skill.html', SkillModalInstanceCtrl, $scope.user.skills);
        }

        // deletes any element by position of the collection after seeking user confirmation
        $scope.openDeleteModal = function(pos, collection) {
            var modal = $modal.open({
                templateUrl: 'partials/modal_me_confirmation.html'
            });

            modal.result.then(function () {
                if ( ~pos ) collection.splice(pos, 1);

                $scope.saveProfile();
            })
        }

    }
]);

var PersonalModalInstanceCtrl = function($scope, data) {
    $scope.data = data;

    $scope.data.dateOfBirth = new Date($scope.data.dateOfBirth);

    $scope.dateOfBirthOptions = {
        changeYear: true,
        changeMonth: true,
        yearRange: '1900:-0',
        dateFormat: 'd MM yy'
    };
};

var QualificationTenureModalInstanceCtrl = function($scope, data, MONTHS) {
    $scope.data = data;

    $scope.startedOn = {};
    $scope.endedOn = {};

    // setting month and year values
    $scope.months = MONTHS;
    $scope.years = [];

    var now = new Date();

    for (var i = now.getFullYear(); i >= now.getFullYear() - 40; i--) {
        $scope.years.push(i.toString());
    }

    // puts the date value in two select boxes
    var setMonthAndDate = function(source, target) {
        target.month = moment(source).format('MMMM');
        target.year = moment(source).format('YYYY');
    }

    // converting startedOn and endedOnvalues
    if ($scope.data.startedOn) {
        setMonthAndDate($scope.data.startedOn, $scope.startedOn);
    }
    if ($scope.data.endedOn) {
        setMonthAndDate($scope.data.endedOn, $scope.endedOn);
    }

    var convertToDate = function (year, month) {
        if (year && month) {
            return moment(month + ' 1 ' + year).format();
        }
    }

    $scope.submit = function() {
        // need to parse the month/year combination before submitting
        $scope.data.startedOn = convertToDate($scope.startedOn.year, $scope.startedOn.month);
        $scope.data.endedOn = convertToDate($scope.endedOn.year, $scope.endedOn.month);

        $scope.$close(data);
    }
}

var SkillModalInstanceCtrl = function ($scope, data) {
    $scope.data = data;
}

