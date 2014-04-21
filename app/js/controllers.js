/* jshint indent: false */

'use strict';

/* Controllers */
var controllers = angular.module('kodiak.controllers', ['kodiak.configs']);

controllers.controller('SignupCtrl', function($scope, $http, $location, userService, validationService,
    notificationService, $state, $stateParams) {
    $scope.user = {};

    $scope.user.token = $stateParams.token;

    $scope.create = function(user) {
        try {
            validationService.mustBeTrue($scope.user.firstName && $scope.user.lastName,
                'First and last names are required');
            validationService.mustBeTrue($scope.user.email,
                'Your e-mail address is required');
            validationService.mustBeTrue($scope.user.password && $scope.user.password.length >= 8,
                'Your password must be at least 8 characters');
            validationService.mustBeTrue($scope.user.password === $scope.user.passwordConfirmation,
                'Your password and password confirmation do not match');
        } catch (e) {
            return;
        }

        userService.create(user)
            .success(function() {
                notificationService.handleSuccess('Account created. But you will have to login to ' +
                    'your email and click the activation link first.');

                $state.go('home');
            });
    };
});


controllers.controller('LoginCtrl', ['$scope', '$http', '$location', 'userService',
    'notificationService', '$rootScope', '$state', '$stateParams',
    function($scope, $http, $location, userService, notificationService, $rootScope, $state,
        $stateParams) {
        $scope.validate = function(user) {
            userService.login(user, function(err, data) {
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
    }
]);

controllers.controller('ActivateCtrl', ['$scope', '$http', '$stateParams', 'userService',
    'notificationService', '$state',
    function($scope, $http, $stateParams, userService, notificationService, $state) {
        $scope.user = {
            token: $stateParams.token
        };

        $scope.submit = function() {
            if ($stateParams.resetRequired === 'true') {
                if ($scope.pass1.length < 8) {
                    notificationService.handleError('Your new password must contain at least 8 characters');
                    return;
                } else if ($scope.pass1 !== $scope.pass2) {
                    notificationService.handleError('Password and password confirmation must match');
                    return;
                }
            }

            $scope.user.password = $scope.pass1;

            userService.activate($scope.user).success(function() {
                notificationService.handleSuccess('Your account had been activated successfully. Please log in');
                $state.go('login');
            });
        };

        if ($stateParams.resetrequired === 'true') {
            $scope.showPasswordReset = true;
        } else {
            $scope.submit(); // if no reset is required, we'll just submit
        }
    }
]);

controllers.controller('PersonalModalInstanceCtrl', function($scope, data, validationService, MONTHS) {
    $scope.data = angular.copy(data, $scope.data);
    $scope.dateOfBirth = {};

    $scope.months = MONTHS;
    $scope.years = [];

    var now = moment().year();
    for (var i = now - 15; i >= now - 70; i--) {
        $scope.years.push(i.toString());
    }

    if ($scope.data.dateOfBirth) {
        var dob = $scope.data.dateOfBirth = moment(new Date($scope.data.dateOfBirth));

        $scope.dateOfBirth = {};
        $scope.dateOfBirth.year = dob.format('YYYY');
        $scope.dateOfBirth.month = dob.format('MMMM');
        $scope.dateOfBirth.date = dob.format('DD');
    }

    $scope.submit = function() {
        try {
            if ($scope.dateOfBirth.year || $scope.dateOfBirth.month || $scope.dateOfBirth.date) {
                var dob = moment($scope.dateOfBirth.date + '-' +
                    $scope.dateOfBirth.month + '-' + $scope.dateOfBirth.year, 'DD-MMMM-YYYY');

                validationService.mustBeTrue(dob.isValid(),
                    'Date of birth is invalid');

                $scope.data.dateOfBirth = new Date(dob.format()); //back to a date object
            }

            if ($scope.data.contactNumber) {
                validationService.mustBeTrue($scope.data.contactNumber.length >= 10,
                    'Contact Number should have 10 digits at least');
            }
        } catch (e) {
            return;
        }

        $scope.$close($scope.data);
    };
});

controllers.controller('QualificationTenureModalInstanceCtrl', function($scope, data, MONTHS, validationService, userService) {
    $scope.data = angular.copy(data, $scope.data);
    $scope.meta = data.meta;

    $scope.startedOn = {};
    $scope.endedOn = {};

    // setting month and year values
    $scope.months = MONTHS;
    $scope.years = [];
    // $scope.current = true;

    $scope.queried = {
        qualifications: [],
        qualificationFields: []
    };

    $scope.updateQualificationsQuery = function(query) {
        if (query.length < 2) {
            return;
        }

        userService.getQualifications(query).success(function(data) {
            $scope.queried.qualifications = data.results;
        });
    };

    $scope.updateQualificationFieldsQuery = function(query) {
        if (query.length < 2) {
            return;
        }

        userService.getQualificationFields(query).success(function(data) {
            $scope.queried.qualificationFields = data.results;
        });
    };

    // reset the end date to null on selecting "I currently work here" checkbox in tenure modal
    $scope.changeEndDate = function() {
        if ($scope.data.current) {
            $scope.endedOn = null;
            $scope.data.endedOn = null;
        } else {
            $scope.data.endedOn = $scope.endedOn;
        }
    };

    var now = moment().year();

    for (var i = now; i >= now - 40; i--) {
        $scope.years.push(i.toString());
    }

    // puts the date value in two select boxes
    var setMonthAndDate = function(source, target) {
        target.month = moment(source).format('MMMM');
        target.year = moment(source).format('YYYY');
    };

    // converting startedOn and endedOnvalues
    if ($scope.data.startedOn) {
        setMonthAndDate($scope.data.startedOn, $scope.startedOn);
    }

    if ($scope.data.endedOn) {
        setMonthAndDate($scope.data.endedOn, $scope.endedOn);
        $scope.data.current = false;
    } else {
        $scope.data.current = true;
    }

    // $scope.complete = $scope.data.complete;

    // converts a given datepicker month/year to javascript date
    var convertToDate = function(year, month) {
        if (year && month) {
            return moment(month + ' 1 ' + year).format();
        }
    };

    $scope.submit = function(t) {
        // $scope.data.complete = $scope.complete;

        // need to parse the month/year combination before submitting
        $scope.data.startedOn = convertToDate($scope.startedOn.year, $scope.startedOn.month);

        if (!$scope.data.current || $scope.data.complete) {
            $scope.data.endedOn = convertToDate($scope.endedOn.year, $scope.endedOn.month);
        }

        try {
            if (t === 'q') { // if $scope is a qualification
                validationService.mustBeTrue($scope.data.name, 'Qualification name should be defined');
                validationService.mustBeTrue($scope.data.issuedBy,
                    'Issued School/University/Institute should be defined');
                if ($scope.data.complete) {
                    validationService.mustBeTrue($scope.data.startedOn <= $scope.data.endedOn,
                        'Start date should be before the end date');
                }
            } else {
                validationService.mustBeTrue($scope.data.position, 'Your position must be defined');
                validationService.mustBeTrue($scope.data.organization,
                    'The organization you worked at must be defined');
                if (!$scope.data.current) {
                    validationService.mustBeTrue($scope.data.startedOn <= $scope.data.endedOn,
                        'Start date should be before the end date');
                }
            }

            validationService.mustBeTrue($scope.data.startedOn, 'Started month should be defined');
        } catch (e) {
            return;
        }

        $scope.$close($scope.data);
    };
});

controllers.controller('SkillModalInstanceCtrl', ['$scope', 'data',
    function($scope, data) {
        $scope.data = angular.copy(data, $scope.data);

        $scope.examples = ['Fixed Asset Accounting', 'Nuclear Physics', 'Recruitment and Selection', 'Javascript', 'Negative Asset Management'];
    }
]);

controllers.controller('CVUploadCtrl', function($scope, userService, notificationService) {
    $scope.uploadFile = function(files) {
        userService.uploadCv(files)
            .success(function(data) {
                notificationService.handleSuccess('CV Uploaded and analyzed successfully.');
                $scope.$close(data.profile);
            }).error(function() {
                $scope.$dismiss();
            });
    };
});

controllers.controller('PrivateMeCtrl', function($scope, userService, $rootScope) {
    userService.getProfile($rootScope.u._id)
        .success(function(data) {
            $scope.user = data;
            // simulate what the employer sees here.
            $scope.forEmployer = true;
        });
});

controllers.controller('MeCtrl', function($scope, $http, $location, $modal, userService, notificationService, utilService, $state) {

    if ($state.is('editProfile')) {
        $scope.edit = true;
    } else {
        $scope.edit = false;
    }

    $scope.enableEdit = function() {
        $scope.edit = true;
    };

    $scope.disableEdit = function() {
        $scope.edit = false;
    };

    $scope.getTimes = utilService.getTimes;

    var loadProfileStats = function() {
        userService.getProfileStats()
            .success(function(data) {
                $scope.stats = data;
            });
    };

    userService.getProfile()
        .success(function(data) {
            $scope.user = data;

            // redirect the user if profile is relatively empty and not from builder
            if (data.tenures.length === 0 && data.qualifications.length === 0 && data.skills.length === 0 && $scope.edit === false) {
                $state.go('profileBuilder');
            }
        });

    loadProfileStats();

    var bindAddEditModal = function(itemToEdit, templateUrl, instanceController, collection) {
        // holds a copy of the referred object so that edits won't appear instantaneously
        // if it's an addition, returns a new object
        var objToManipulate = itemToEdit || {};


        var modal = $modal.open({
            templateUrl: templateUrl,
            controller: instanceController,
            resolve: {
                data: function() {
                    return objToManipulate;
                }
            }
        });

        modal.result.then(function(manipulated) {
            if (itemToEdit) {
                collection[collection.indexOf(itemToEdit)] = manipulated;
            } else {
                collection.push(manipulated);
            }

            $scope.saveProfile();
        });
    };

    $scope.convertGender = function(gender) {
        if (gender) {
            return 'Male';
        } else if (gender === false) {
            return 'Female';
        }
    };

    $scope.saveProfile = function() {
        userService.saveProfile($scope.user)
            .success(function(data) {
                loadProfileStats();
                notificationService.notify({
                    title: 'Change(s) saved!',
                    text: 'Successfully saved change(s) made to your profile.',
                    type: 'success',
                    hide: true
                });

                $scope.user = data.profile;
            }).error(function(data) {
                if (data.profile) {
                    $scope.user = data.profile;
                }
            });
    };

    // personal modal
    $scope.openPersonalModal = function(profile) {
        var personalModal = $modal.open({
            templateUrl: 'partials/modal_me_personal.html',
            controller: 'PersonalModalInstanceCtrl',
            resolve: { // we're sending these data from this controller to the modal's controller
                data: function() {
                    return {
                        location: profile.location,
                        contactNumber: profile.contactNumber,
                        languages: profile.languages,
                        nationalIdentifier: profile.nationalIdentifier,
                        dateOfBirth: profile.dateOfBirth,
                        gender: profile.gender
                    };
                }
            }
        });

        personalModal.result.then(function(personalData) { // when the modal returns a result
            profile.location = personalData.location;
            profile.contactNumber = personalData.contactNumber;
            profile.languages = personalData.languages;
            profile.nationalIdentifier = personalData.nationalIdentifier;
            if (personalData.dateOfBirth) {
                profile.dateOfBirth = new Date(personalData.dateOfBirth);
            }
            profile.gender = personalData.gender;

            $scope.saveProfile();
        });
    };

    $scope.openUploadCVModal = function() {
        var cvModal = $modal.open({
            templateUrl: 'partials/modal_me_cv.html',
            controller: 'CVUploadCtrl'
        });

        cvModal.result.then(function(profile) {
            $scope.cvUploaded = true;
            $scope.user.location = profile.location;
            $scope.user.contactNumber = profile.contactNumber;
            $scope.user.qualifications = profile.qualifications;
            $scope.user.tenures = profile.tenures;
            $scope.user.skills = profile.skills;
            $scope.edit = true;

            $scope.saveProfile();
        });
    };

    // qualification modal
    $scope.openQualificationModal = function(qualification) {
        bindAddEditModal(qualification, 'partials/modal_me_qualification.html',
            'QualificationTenureModalInstanceCtrl', $scope.user.qualifications);
    };

    // tenure modal
    $scope.openTenureModal = function(tenure) {
        bindAddEditModal(tenure, 'partials/modal_me_tenure.html', 'QualificationTenureModalInstanceCtrl',
            $scope.user.tenures);
    };

    // skills modal
    $scope.openSkillModal = function() {
        var skillModal = $modal.open({
            templateUrl: 'partials/modal_me_skill.html',
            controller: 'SkillModalInstanceCtrl',
            resolve: {
                data: function() {
                    return {
                        skills: $scope.user.skills
                    };
                }
            }
        });

        skillModal.result.then(function(manipulated) {
            $scope.user.skills = manipulated;
            $scope.saveProfile();
        });
    };

    // deletes any element by position of the collection after seeking user confirmation
    $scope.openDeleteModal = function(item, collection) {
        var modal = $modal.open({
            templateUrl: 'partials/modal_me_confirmation.html'
        });

        modal.result.then(function() {
            collection.splice(collection.indexOf(item), 1);
            $scope.saveProfile();
        });
    };

});

controllers.controller('CreateOrgCtrl', ['$scope', '$http', 'orgService', '$location',
    'userService', 'notificationService',
    function($scope, $http, orgService, $location, userService, notificationService) {

        $scope.submit = function(org, admin) {
            orgService.createOrg(org)
                .success(function(data) {
                    notificationService.notify({
                        title: 'Success!',
                        text: 'Organization Created',
                        type: 'success',
                        hide: true
                    });

                    // creating the admin user
                    var user = {
                        firstName: admin.name,
                        email: admin.email,
                        affiliation: data.organization._id
                    };

                    userService.createOrgUser(user)
                        .success(function() {
                            notificationService.handleSuccess('Please check your e-mail inbox ' +
                                'and click the confirmation link, please',
                                'Admin account created!');
                        });
                });
        };
    }
]);

controllers.controller('EditOrgCtrl', [
    '$scope',
    'orgService',
    '$rootScope',
    'notificationService',
    'GRIZZLY_URL',
    'userService',
    '$state',
    function($scope, orgService, $rootScope, notificationService, $state) {
        $scope.editMode = true;

        orgService.getOrg($rootScope.u.affiliation)
            .success(function(data) {
                $scope.org = data.organization;
            });

        $scope.notReady = true;
        $scope.uploadFile = function(files) {
            var img = new Image();
            img.src = window.URL.createObjectURL(files[0]);

            img.onload = function() {
                if (img.naturalWidth === 400 && img.naturalHeight === 300) {
                    orgService.uploadLogo($rootScope.u.affiliation, files)
                        .success(function() {
                            notificationService.handleSuccess('Logo uploaded successfully');
                        });
                } else {
                    notificationService.handleError('Your logo should have a 400px width and a 300px height');
                }

                window.URL.revokeObjectURL(img.src);
            };
        };

        $scope.submit = function(org) {
            orgService.editOrg($rootScope.u.affiliation, org)
                .success(function() {
                    notificationService.handleSuccess('Organization details updated');
                    $state.go('organizationDashboard');
                });
        };
    }
]);

controllers.controller('ViewOrgCtrl', ['$scope', 'userService', 'orgService', '$rootScope',
    'notificationService', '$modal',
    function($scope, userService, orgService, $rootScope, notificationService, $modal) {
        $scope.currentUserId = $rootScope.u._id;

        var getUsers = function() {
            orgService.getUsers($rootScope.u.affiliation)
                .success(function(data) {
                    $scope.users = data.users;
                });
        };

        orgService.getAds($rootScope.u.affiliation).success(function(data) {
            $scope.org = {
                _id: $rootScope.u.affiliation
            };

            $scope.campaigns = data.advertisements;
        });

        getUsers();

        $scope.openUserDeleteModal = function(id) {
            var modal = $modal.open({
                templateUrl: 'partials/modal_org_user_delete_confirmation.html'
            });

            modal.result.then(function() {
                orgService.deactivateUser($scope.org._id, id)
                    .success(function() {
                        notificationService.handleSuccess('User was deactivated');
                        getUsers();
                    });
            });
        };

        $scope.openCreateUserModal = function() {
            var modal = $modal.open({
                templateUrl: 'partials/modal_org_user_create.html'
            });

            modal.result.then(function(data) {
                var user = {
                    firstName: data.name,
                    email: data.email,
                    affiliation: $rootScope.u.affiliation
                };

                userService.createOrgUser(user)
                    .success(function() {
                        notificationService.handleSuccess('User account created. We have ' +
                            'sent an email notifying the new user');
                    });
            });
        };
    }
]);

controllers.controller('ViewCampaignCtrl', ['$scope', 'userService', 'orgService', '$rootScope',
    'notificationService', 'adService', '$stateParams', 'searchService', 'adResponseService',
    function($scope, userService, orgService, $rootScope, notificationService, adService, $stateParams,
        searchService, adResponseService) {
        $scope.selectedCandidate = [];

        // so that we can see the limited profile meant for employers
        $scope.forEmployer = true;

        $scope.gridOptions = {
            data: 'responses',
            showGroupPanel: true,
            selectedItems: $scope.selectedCandidate,
            multiSelect: false,
            showFilter: true,
            showColumnMenu: true,
            columnDefs: [{
                field: 'name',
                displayName: 'Name',
                width: '*'
            }, {
                field: 'status',
                displayName: 'Status',
                width: '*'
            }, {
                field: 'updated',
                displayName: 'Last Updated',
                width: '*'
            }, {
                field: 'tags',
                displayName: 'Tags',
                width: '**'
            }, {
                field: 'id',
                displayName: 'ID',
                visible: false,
                width: '*'
            }]
        };

        // on change for the selected candidate, change the gr-visualized-profile
        $scope.$watch('selectedCandidate[0]', function() {
            if ($scope.selectedCandidate.length === 0) {
                return;
            }

            $scope.data = {};

            userService.getProfile($scope.selectedCandidate[0].user)
                .success(function(data) {
                    $scope.user = data;
                });
        });

        adService.getAd($rootScope.u.affiliation, $stateParams.adId)
            .success(function(data) {
                $scope.ad = data.advertisement;
                $scope.ad.name = $scope.ad.jobRole + '-' + moment($scope.ad.createdOn).format('MMM DD');
            });

        var loadResponses = function() {
            adResponseService.getAllResponses($rootScope.u.affiliation, $stateParams.adId)
                .success(function(data) {
                    $scope.responses = _.map(data.responses, function(r) {
                        return {
                            id: r._id,
                            user: r.user._id ? r.user._id : r.user,
                            name: r.user.lastName ? r.user.firstName + ' ' + r.user.lastName : r.user.limitedName,
                            status: r.status,
                            updated: moment(r.lastUpdatedOn).fromNow(),
                            tags: r.tags && r.tags.join(', ')
                        };
                    });
                });
        };

        loadResponses();

        $scope.save = function(response, status, tags) {
            adResponseService.editResponse($rootScope.u.affiliation, $stateParams.adId, response.id, status,
                tags)
                .success(function() {
                    notificationService.handleSuccess('Successfully updated the candidate');
                    loadResponses();
                });
        };
    }
]);

controllers.controller('AdCtrl', ['$scope',
    'orgService',
    'userService',
    'adService',
    'notificationService',
    '$location',
    '$stateParams',
    '$state',
    '$rootScope',

    function($scope, orgService, userService, adService, notificationService, $location, $stateParams,
        $state, $rootScope) {

        orgService.getOrg($rootScope.u.affiliation)
            .success(function(data) {
                $scope.org = data.organization;
            });

        $scope.ad = {};
        $scope.ad.questions = [];

        $scope.today = moment().format('YYYY-MM-DD');
        $scope.maxDate = moment().add('weeks', 4).format('YYYY-MM-DD');

        // if state.current is edit, we need to transform the ad properties and fill the $scope.ad
        if ($state.is('editAdvertisement')) {
            $scope.heading = 'Edit Advertisement';

            adService.getAd($rootScope.u.affiliation, $stateParams.adId)
                .success(function(data) {
                    $scope.ad = data.advertisement;

                    // transforming the questions
                    var q = $scope.ad.questions;

                    // re-initialize $scope array holders
                    $scope.ad.questions = [];
                    _.each(q, function(v) {
                        $scope.ad.questions.push({
                            value: v
                        });
                    });

                    // convert the stringified date to a Date object
                    // ui-date (date picker) requires so
                    $scope.ad.expiredOn = new Date($scope.ad.expiredOn);

                    $scope.postedOn = moment().calendar();
                    $scope.expiresOn = function() {
                        return moment($scope.ad.expiredOn).calendar();
                    };
                });
        } else { // this should be the create state then
            $scope.heading = 'Create Advertisement';

            $scope.postedOn = moment().calendar();
            $scope.expiresOn = function() {
                return moment($scope.ad.expiredOn).calendar();
            };
        }

        // adds an element to an array
        $scope.addElement = function(arr) {
            arr.push({});
        };

        // removes an element from an array
        $scope.removeElement = function(arr, i) {
            arr.splice(i, 1);
        };

        $scope.submit = function(ad) {
            // transform questions to independent arrays.
            // currently they are nested under obj.value properties
            ad.questions = _.pluck($scope.ad.questions, 'value');

            if ($state.is('createAdvertisement')) {
                adService.createAd($rootScope.u.affiliation, ad)
                    .success(function(data) {
                        $state.go('campaignHome', {
                            adId: data.id
                        });
                    });
            } else {
                adService.editAd($rootScope.u.affiliation, $scope.ad.id, ad)
                    .success(function() {
                        $state.go('organizationDashboard');
                    });
            }
        };
    }
]);

controllers.controller('ViewAdCtrl', ['$scope', 'orgService', 'adService', '$stateParams', 'userService',
    'notificationService', '$rootScope',
    function($scope, orgService, adService, $stateParams, userService, notificationService, $rootScope) {
        $scope.org = {};
        $scope.ad = {};

        adService.getAd($rootScope.u.affiliation, $stateParams.adId)
            .success(function(data) {

                $scope.ad = data.advertisement;
            });

        orgService.getOrg($rootScope.u.affiliation)
            .success(function(data) {
                $scope.org = data.organization;
            });
    }
]);

controllers.controller('ViewPublicAdCtrl', ['$scope', 'orgService', 'adService', '$stateParams',
    'userService', 'notificationService', 'adResponseService', '$rootScope',
    function($scope, orgService, adService, $stateParams, userService, notificationService,
        adResponseService, $rootScope) {
        $scope.org = {};
        $scope.ad = {};

        $scope.apply = function() {
            adResponseService.createResponse($rootScope.u._id, $scope.org._id, $scope.ad._id, null)
                .success(function() {
                    notificationService.handleSuccess('Saved your application successfully');
                    $scope.status = 'applied';
                });
        };

        var getAdvertisement = function(method) {
            method($stateParams.orgId, $stateParams.adId)
                .success(function(data) {
                    $scope.ad = data.advertisement;
                });
        };

        if ($stateParams.from === 'email') {
            $scope.status = 'invited';
            getAdvertisement(adService.getAd);
        } else if (userService.isLoggedIn()) {
            userService.getResponses().success(function(data) {
                if (data.responses.length > 0) {
                    var relevantResponse = _.find(data.responses, function(r) {
                        return r.advertisement._id === $stateParams.adId;
                    });

                    if (relevantResponse) {
                        $scope.status = relevantResponse.status;
                        getAdvertisement(adService.getAd);
                    } else {
                        getAdvertisement(adService.getAdPublic);
                    }

                } else {
                    getAdvertisement(adService.getAdPublic);
                }
            });
        } else {
            getAdvertisement(adService.getAdPublic);
        }

        orgService.getOrg($stateParams.orgId)
            .success(function(data) {
                $scope.org = data.organization;
            });
    }
]);

controllers.controller('SearchCtrl', function($scope, $rootScope, $stateParams, userService, adService, searchService, notificationService,
    validationService, $modal, $location, adResponseService, $state) {
    $scope.displayNameCollection = {
        AGE_BETWEEN: {
            name: 'Age between',
            isRange: true,
            type: 'number',
            placeholder: ['from', 'to']
        },
        TOTAL_EXPERIENCE_BETWEEN: {
            name: 'Total experience between',
            isRange: true,
            type: 'number',
            placeholder: ['from', 'to']
        },
        CURRENT_POSITION_LIKE: {
            name: 'Current position like',
            isRange: false,
            type: 'string',
            placeholder: []
        },
        EXPERIENCE_LIKE: {
            name: 'Experienced in',
            isRange: false,
            type: 'string',
            placeholder: []
        },
        QUALIFICATIONS_LIKE: {
            name: 'Qualifications include',
            isRange: false,
            type: 'string',
            placeholder: []
        },
        QUALIFICATIONS_FIELD_LIKE: {
            name: 'Qualified in',
            isRange: false,
            type: 'string',
            placeholder: []
        },
        SKILLS_LIKE: {
            name: 'Skills include',
            isRange: false,
            type: 'string',
            placeholder: []
        }
    };

    $scope.ad = null;
    $scope.searchId = $stateParams.searchId;
    $scope.searchCreated = false; // fix for a phantom promise return

    searchService.getSearchForAd($rootScope.u.affiliation, $stateParams.adId)
        .success(function(data) {
            $scope.search = data.search;
            initiate();

        }).error(function() {
            adService.getAd($rootScope.u.affiliation, $stateParams.adId)
                .success(function(data) {
                    if ($scope.searchCreated) {
                        return;
                    } else {
                        $scope.searchCreated = true;
                    }

                    $scope.ad = data.advertisement;

                    var search = {
                        advertisement: $scope.ad.id,
                        name: $scope.ad.jobRole
                    };

                    searchService.createSearch($rootScope.u.affiliation, search)
                        .success(function(data) {
                            searchService.getSearch($rootScope.u.affiliation, data.id)
                                .success(function(data) {
                                    $scope.search = data.search;
                                    initiate();
                                });
                        });
                });
        });

    var initiate = function() {
        if (!$scope.search.criteria) {
            $scope.search.criteria = [];
        }

        for (var i = 0; i < $scope.search.criteria.length; i++) {
            $scope.search.criteria[i].displayName =
                $scope.displayNameCollection[$scope.search.criteria[i].name].name;
        }
    };

    var resetCriterion = function() {
        $scope.criterion = {
            values: [],
            weight: 1
        };
    };

    resetCriterion();

    var saveSearch = function() {
        var search = {
            name: $scope.search.name,
            criteria: $scope.search.criteria
        };


        searchService.editSearch($rootScope.u.affiliation, $scope.search.id, search)
            .success(function() {
                notificationService.handleSuccess('Search updated successfully.');
            });
    };


    $scope.add = function(criterion) {
        try {
            validationService.mustBeTrue(criterion.name, 'Search criterion type is required');
            validationService.mustBeTrue(criterion.values[0], 'Search values should be defined');
            if ($scope.displayNameCollection[criterion.name].isRange) {
                validationService.mustBeTrue(criterion.values[1], 'Search value range should be defined');
                // if the user is going to define filter criteria like age and years of experience
                // more than once
                validationService.mustBeTrue(!(_.find($scope.search.criteria, function(c) {
                    return c.name === $scope.criterion.name;
                })), 'You can not specify multiple search criteria of this kind');
            }

        } catch (e) {
            return;
        }

        $scope.search.criteria.push({
            name: criterion.name,
            values: _.clone(criterion.values),
            displayName: $scope.displayNameCollection[criterion.name].name,
            weight: criterion.weight
        });

        saveSearch();
        resetCriterion();
    };

    // removes an element from an array
    $scope.removeElement = function(arr, i) {
        arr.splice(i, 1);
        saveSearch();
    };

    $scope.doSearch = function() {
        $state.go('results', {
            adId: $stateParams.adId,
            searchId: $scope.search.id
        });
    };
});

controllers.controller('SearchResultsCtrl', function($scope, searchService, $rootScope, adResponseService, $stateParams, $state, userService, notificationService) {
    $scope.forEmployer = true;

    searchService.getSearchResults($rootScope.u.affiliation, $stateParams.searchId)
        .success(function(data) {
            if (data.scores.hits.hits.length !== 0) {
                searchService.getSearch($rootScope.u.affiliation, $stateParams.searchId).success(function(searchData) {
                    $scope.search = searchData.search;
                    markInvitedCandidates(data.scores.hits.hits);
                });

                $scope.allResults = data.scores.hits.hits;
                $scope.showTop(10);
            } else {
                $scope.allResults = [];
                notificationService.handleInfo('No candidates found matching that criteria',
                    'Nothing to show!');
            }
        });

    $scope.invite = function(id, tags) {
        adResponseService.createResponse(id, this.$parent.u.affiliation, $stateParams.adId, tags)
            .success(function() {
                $scope.user.invited = true;
                notificationService.handleSuccess('Candidate was invited successfully');
                markInvitedCandidates($scope.allResults);
            });
    };

    $scope.loadProfile = function(id, invited) {
        userService.getProfile(id)
            .success(function(data) {
                $scope.user = data;
                $scope.user.id = id;
                $scope.user.invited = invited;
            });
    };

    $scope.showTop = function(count) {
        $scope.limitResultsTo = count;
    };

    function markInvitedCandidates(results) {
        adResponseService.getAllResponses($rootScope.u.affiliation, $scope.search.advertisement)
            .success(function(data) {
                var invitedList = _.pluck(data.responses, 'user');
                var fullList = _.pluck(results, '_id');

                var resultsToBeMarked = _.intersection(invitedList, fullList);

                for (var i = 0; i < resultsToBeMarked.length; i++) {
                    for (var j = 0; j < results.length; j++) {
                        if (resultsToBeMarked[i] === results[j]._id) {
                            results[j].invited = true;
                            continue;
                        }
                    }
                }
            });
    }
});

controllers.controller('LogoutCtrl', ['$scope', 'userService',
    function($scope, userService) {
        userService.logout();
    }
]);

controllers.controller('MeDashboardCtrl', ['$scope', 'userService', '$rootScope', 'notificationService',
    '$modal', 'adResponseService',
    function($scope, userService, $rootScope, notificationService, $modal, adResponseService) {
        $scope.responses = [];

        $scope.hasActive = false;
        $scope.hasInactive = false;
        $scope.hasPending = false;


        var changeStatus = function(status, response, successMsg) {
            adResponseService.editResponse(response.advertisement.organization._id,
                response.advertisement._id, response._id, status, null)
                .success(function() {
                    notificationService.handleSuccess(successMsg);
                    loadResponses();
                });
        };

        $scope.accept = function(response) {
            var modal = $modal.open({
                templateUrl: 'partials/modal_response_accept.html'
            });

            modal.result.then(function() {
                changeStatus('accepted', response, 'You have successfully accepted the invitation from' +
                    response.advertisement.organization.name);
            });

        };

        $scope.reject = function(response) {
            var modal = $modal.open({
                templateUrl: 'partials/modal_response_reject.html'
            });

            modal.result.then(function() {
                changeStatus('withdrawn', response, 'You have rejected the invitation from ' +
                    response.advertisement.organization.name);
            });
        };

        $scope.withdraw = function(response) {
            var modal = $modal.open({
                templateUrl: 'partials/modal_response_withdraw.html'
            });

            modal.result.then(function() {
                changeStatus('withdrawn', response, 'You have withdrawn your application to ' +
                    response.advertisement.organization.name);
            });
        };

        var loadResponses = function() {
            userService.getResponses().success(function(data) {
                if (data.responses.length === 0) {
                    notificationService.handleInfo('You do not have any active applications',
                        'No applications');
                    return;
                }

                $scope.responses = {
                    invited: [],
                    active: [],
                    inactive: []
                };

                _.each(data.responses, function(response) {
                    if (response.status === 'invited') {
                        $scope.responses.invited.push(response);
                    } else if (response.status === 'accepted' || response.status === 'applied') {
                        $scope.responses.active.push(response);
                    } else if (response.status === 'withdrawn' || response.status === 'rejected') {
                        $scope.responses.inactive.push(response);
                    }
                });
            });
        };

        loadResponses();
    }
]);

controllers.controller('JobBoardCtrl', ['$scope', 'adService', 'notificationService', '$location',
    function($scope, adService) {
        $scope.ads = [];

        adService.getAdsPublic().success(function(data) {
            $scope.ads = data.ads;
        });
    }
]);

controllers.controller('NotificationsNavCtrl', ['$scope', '$rootScope', 'subwayService',
    'notificationService', '$location',
    function($scope, $rootScope, subwayService, notificationService, $location) {
        $scope.markAsRead = function(notification) {
            subwayService.markAsRead(notification._id).success(function(data) {
                $rootScope.$broadcast('refreshNotifications');
                $rootScope.notifications = data;
            });
        };

        $rootScope.$watch('notifications', function() {
            $scope.notifications = $rootScope.notifications;
        });

        $scope.goto = function(notification) {
            subwayService.markAsRead(notification._id).success(function() {
                $rootScope.$broadcast('refreshNotifications');

                var fullUrl = notification.link;
                var path = fullUrl.substring(fullUrl.indexOf('#') + 1);
                $location.url(path);
                $scope.$dismiss();
            });
        };

        $scope.notifications = $rootScope.notifications;
    }
]);

controllers.controller('ResetPasswordCtrl', [
    '$scope',
    'userService',
    'notificationService',
    'validationService',
    function($scope, userService, notificationService, validationService) {
        $scope.submit = function(email) {
            try {
                validationService.mustBeTrue( !! email, 'Email cannot be empty');
            } catch (e) {
                return;
            }

            userService.requestPasswordReset(email)
                .success(function() {
                    notificationService.handleSuccess(
                        'A password reset link was sent to your email address');
                });
        };
    }
]);

controllers.controller('ChangePasswordCtrl', [
    '$scope',
    'userService',
    'notificationService',
    'validationService',
    '$stateParams',
    function($scope, userService, notificationService, validationService,
        $stateParams) {

        if ($stateParams.token) {
            $scope.token = $stateParams.token;
        }

        $scope.submit = function(password) {
            try {
                validationService.mustBeTrue( !! password,
                    'Password can not be empty'
                );

                validationService.mustBeTrue(
                    $scope.password === $scope.passwordConfirmation,
                    'Password confirmation was different that the password'
                );
            } catch (e) {
                return;
            }

            userService.changePassword(password, $scope.token)
                .success(function() {
                    if (userService.isLoggedIn()) {
                        notificationService.handleSuccess(
                            'Your password had been changed successfully.'
                        );
                    } else {
                        notificationService.handleSuccess(
                            'Your password was changed. Please log in with the' +
                            ' new password.'
                        );
                    }
                });
        };
    }
]);

controllers.controller('ViewOrgProfileCtrl', function($scope, $stateParams, $rootScope, orgService) {

    $scope.org = {
        _id: $stateParams.orgId
    };

    orgService.getOrg($stateParams.orgId)
        .success(function(data) {
            $scope.org = data.organization;
        });

    orgService.getPublicAds($stateParams.orgId)
        .success(function(data) {
            $scope.ads = data.advertisements;
        });
});

controllers.controller('LandingCtrl', function($scope, inviteService) {
    $scope.invite = function(email) {
        inviteService.inviteUser(email)
            .success(function() {
                $scope.invited = true;
            });
    };
});

controllers.controller('AdminUsersCtrl', function($scope, adminService, $localStorage) {
    $scope.lastUpdatedOn = angular.fromJson($localStorage.adminUpdatedOn);

    adminService.getAllUsers().success(function(data) {
        $scope.data = data;

        $scope.goodUsers = _.filter(data, function(user) {
            return user.tenures.length + user.qualifications.length + user.skills.length > 0;
        });
    });
});

controllers.controller('AdminInvitesCtrl', function($scope, adminService, notificationService) {
    $scope.getUninvited = function() {
        adminService.getUninvited().success(function(data) {
            $scope.data = data;
        });
    };

    $scope.getUninvited();

    $scope.inviteUser = function(id) {
        adminService.sendInvitation(id).success(function() {
            notificationService.handleSuccess('Invitation sent successfully.');
            $scope.getUninvited();
        });
    };
});

controllers.controller('ProfileBuilderCtrl', function($scope, $modal, userService, notificationService, $state) {
    var employed = null;

    $scope.start = function() {
        $modal.open({
            templateUrl: 'partials/modal_yes_no.html',
            controller: function($scope) {
                $scope.question = 'Are you employed somewhere, or have been emplyed before?';
                $scope.yesOption = 'Yes, I have/had a job';
                $scope.noOption = 'No, I have never had a job before';
            }
        }).result.then(function(result) {
            if (result === 'yes') {
                $scope.steps[0].fn = $scope.openTenureModal;
                employed = true;
            } else {
                $scope.steps[0].fn = $scope.openQualificationModal;
                employed = false;
            }

            $scope.next();
        });
    };

    $scope.openTenureModal = function() {
        var modal = $modal.open({
            templateUrl: 'partials/modal_me_tenure.html',
            controller: 'QualificationTenureModalInstanceCtrl',
            resolve: {
                data: function() {
                    var data = $scope.steps[0].data;
                    data.meta = {
                        heading: 'Tell us about your current job'
                    };

                    return data;
                }
            }
        });

        modal.result.then(function(tenure) {
            $scope.step.data = tenure;
            $scope.next();
        });
    };

    $scope.openQualificationModal = function() {
        var modal = $modal.open({
            templateUrl: 'partials/modal_me_qualification.html',
            controller: 'QualificationTenureModalInstanceCtrl',
            resolve: {
                data: function() {
                    var data = $scope.steps[0].data;
                    data.meta = {
                        heading: 'Tell us about the qualification you are following'
                    };

                    return data;
                }
            }
        });

        modal.result.then(function(qualification) {
            $scope.step.data = qualification;
            $scope.next();
        });
    };

    $scope.openSkillModal = function() {
        var skillModal = $modal.open({
            templateUrl: 'partials/modal_me_skill.html',
            controller: 'SkillModalInstanceCtrl',
            resolve: {
                data: function() {
                    return {
                        skills: $scope.steps[1].data.skills ? $scope.steps[1].data.skills : [{
                            name: null,
                            experience: null
                        }],
                        meta: {
                            heading: 'What would you say your top 5 skills are?'
                        }
                    };
                }
            }
        });

        skillModal.result.then(function(skills) {
            $scope.step.data = skills;
            $scope.next();
        });
    };

    $scope.openDateOfBirthModal = function() {
        var personalModal = $modal.open({
            templateUrl: 'partials/modal_me_dateofbirth.html',
            controller: 'PersonalModalInstanceCtrl',
            resolve: { // we're sending these data from this controller to the modal's controller
                data: function() {
                    return $scope.steps[2].data;
                }
            }
        });

        personalModal.result.then(function(personalData) { // when the modal returns a result
            $scope.step.data = new Date(personalData.dateOfBirth);
            $scope.next();
        });
    };

    $scope.makeProfileFromSteps = function() {
        var profile = {
            tenures: employed === true ? [$scope.steps[0].data] : [],
            qualifications: employed === false ? [$scope.steps[0].data] : [],
            skills: $scope.steps[1].data,
            dateOfBirth: $scope.steps[2].data
        };

        $scope.save(profile);
    };

    $scope.save = function(profile) {
        userService.saveProfile(profile)
            .success(function() {
                notificationService.handleSuccess('Profile Saved Successfully');
                $state.go('editProfile');
            });
    };

    $scope.skip = function() {
        $state.go('editProfile');
    };

    $scope.steps = [{
        order: 1,
        fn: $scope.openTenureModal,
        status: 'init',
        data: {}
    }, {
        order: 2,
        fn: $scope.openSkillModal,
        status: 'init',
        data: {}
    }, {
        order: 3,
        fn: $scope.openDateOfBirthModal,
        status: 'init',
        data: {}
    }, {
        order: 4,
        fn: $scope.makeProfileFromSteps
    }];

    $scope.next = function() {
        // if the user had been working on a step, mar it as done now
        if ($scope.step) {
            $scope.step.status = 'done';
        }

        var next = $scope.step ? $scope.step.order + 1 : 1;
        $scope.open(next);
    };

    $scope.open = function(step) {
        $scope.step = $scope.steps[step - 1];
        $scope.step.fn();
    };

    $scope.linkedIn = function() {
        function convertDate(obj) {
            if (obj.year) {
                return moment({
                    years: obj.year,
                    months: obj.month || 1,
                    days: obj.day || 1
                });
            } else {
                return null;
            }
        }

        IN.API.Profile('me').fields(['educations', 'certifications', 'positions', 'date-of-birth', 'phone-numbers', 'skills']).result(function(result) {
            $scope.$apply(function() {
                if (result._total === 0) {
                    notificationService.handleError('Error retireving profile');
                    return;
                }

                var inProfile = result.values[0];

                var userProfile = {};

                userProfile.dateOfBirth = convertDate(inProfile.dateOfBirth);

                var qualifications = [];

                if (inProfile.educations && inProfile.educations._total > 0) {
                    inProfile.educations.values.forEach(function(edu) {
                        var qualification = {};

                        qualification.name = edu.degree;
                        qualification.field = edu.fieldOfStudy;
                        qualification.issuedBy = edu.schoolName;
                        qualification.startedOn = convertDate(edu.startDate);
                        qualification.endedOn = convertDate(edu.endDate);
                        qualification.complete = qualification.endedOn !== null;

                        qualifications.push(qualification);
                    });
                }

                if (inProfile.certifications && inProfile.certifications._total > 0) {
                    inProfile.certifications.forEach(function(cert) {
                        var certification = {};

                        certification.name = cert.name;
                        certification.field = null;
                        certification.issuedBy = cert.authority;
                        certification.startedOn = convertDate(cert.startDate);
                        certification.endedOn = convertDate(cert.endDate);

                        qualifications.push(certification);
                    });
                }

                userProfile.qualifications = qualifications;

                if (inProfile.phoneNumbers && inProfile.phoneNumbers._total > 0) {
                    var contactNumber = _.find(inProfile.phoneNumbers.values, function(pnumber) {
                        return pnumber.phoneType === 'mobile';
                    }).phoneNumber;

                    if (!contactNumber) {
                        contactNumber = inProfile.phoneNumbers.values[0].phoneNumber;
                    }

                    userProfile.contactNumber = contactNumber;
                }

                var tenures = [];

                if (inProfile.positions && inProfile.positions._total) {
                    inProfile.positions.values.forEach(function(position) {
                        var tenure = {};

                        tenure.organization = position.company.name;
                        tenure.position = position.title;
                        tenure.startedOn = convertDate(position.startDate);
                        tenure.endedOn = position.isCurrent ? null : convertDate(position.endDate);
                        tenure.responsibilities = position.summary;

                        tenures.push(tenure);
                    });
                }

                userProfile.tenures = tenures;

                var skills = [];

                if (inProfile.skills && inProfile.skills._total > 0) {
                    inProfile.skills.values.forEach(function(skillObj) {
                        skills.push({
                            name: skillObj.skill.name,
                            experience: 1
                        });
                    });
                }

                userProfile.skills = skills;

                $scope.save(userProfile);
            });
        });
    };
});

controllers.controller('OrgMeCtrl', function($scope, userService, $stateParams) {
    $scope.viewedByOrg = true;

    userService.getProfile($stateParams.userId)
        .success(function(data) {
            $scope.user = data;
        });
});