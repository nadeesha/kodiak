'use strict';

/* Controllers */

var controllers = angular.module('kodiak.controllers', ['kodiak.configs']);

controllers.controller('SignupCtrl', ['$scope', '$http', '$location', 'userService', 'notificationService',
    function($scope, $http, $location, userService, notificationService) {
        $scope.create = function(user) {
            userService.create(user, function(err, data) {
                if (!err) {
                    notificationService.notify({
                        title: 'Account created!',
                        text: 'But before you begin, check your e-mail inbox and click the confirmation link, please.',
                        type: 'success',
                        hide: true
                    });
                } else if (err === 409) {
                    notificationService.notify({
                        title: 'Account already exists!',
                        text: 'We already have an account for ' + user.email + '. Please <a href="#/login">log in</a> to your account instead.',
                        type: 'error',
                        hide: true
                    });
                } else {
                    notificationService.handleError(data.message);
                }
            });
        };
    }
]);

controllers.controller('LoginCtrl', ['$scope', '$http', '$location', 'userService',
    'notificationService', '$rootScope', '$stateParams',
    function($scope, $http, $location, userService, notificationService, $rootScope,
        $stateParams) {
        $scope.validate = function(user) {
            userService.login(user, function(err, data) {
                if (!err) {
                    $rootScope.$broadcast('refreshNotifications');

                    if ($stateParams.to) {
                        $location.url(decodeURIComponent($stateParams.to));
                    } else if (data.affiliation) {
                        $location.url('/organization/dashboard');
                    } else {
                        $location.url('/me/view');
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
                        text: 'This account is currently inactive. If you just signed up, please click the activation link we sent to your email.',
                        type: 'error',
                        hide: true
                    });
                } else {
                    notificationService.handleError(data.message);
                }
            });
        };
    }
]);

controllers.controller('ActivateCtrl', ['$scope', '$http', '$location', 'userService', 'notificationService',
    function($scope, $http, $location, userService, notificationService) {
        $scope.response = {
            incorrect: false,
            success: false
        };
        var user = {
            email: ($location.search()).email,
            token: ($location.search()).token
        };

        userService.activate(user, function(err, data) {
            if (!err) {
                $scope.response.incorrect = false;
                $scope.response.success = true;
            } else if (err === 400) {
                $scope.response.incorrect = false;
                $scope.response.success = true;
            } else {
                notificationService.handleError(data.message);
            }
        });
    }
]);

controllers.controller('PersonalModalInstanceCtrl', ['$scope', 'data', 'validationService',
    function($scope, data, validationService) {
        $scope.data = data;

        // parse date string -> Date()
        if ($scope.data.dateOfBirth) {
            $scope.data.dateOfBirth = moment($scope.data.dateOfBirth);
        }

        $scope.submit = function() {
            try {
                if ($scope.data.dateOfBirth) {
                    validationService.mustBeTrue(moment($scope.data.dateOfBirth).isValid(), 'Date of birth is invalid');
                    validationService.mustBeTrue(moment($scope.data.dateOfBirth) < moment().subtract('years', 15), 'You must be at least 15 years old');
                }

                if ($scope.data.contactNumber) {
                    validationService.mustBeTrue($scope.data.contactNumber.length >= 10, 'Contact Number should have 10 digits at least');
                }
            } catch (e) {
                return;
            }

            $scope.$close(data);
        };
    }
]);

controllers.controller('QualificationTenureModalInstanceCtrl', ['$scope', 'data', 'MONTHS', 'validationService',
    function($scope, data, MONTHS, validationService) {
        $scope.data = data;

        $scope.startedOn = {};
        $scope.endedOn = {};

        // setting month and year values
        $scope.months = MONTHS;
        $scope.years = [];
        $scope.current = true;

        // reset the end date to null on selecting "I currently work here" checkbox in tenure modal
        $scope.changeEndDate = function() {
            if (this.current) {
                this.endedOn = null;
                this.data.endedOn = null;
            } else {
                this.data.endedOn = this.endedOn;
            }
        };

        var now = new Date();

        for (var i = now.getFullYear(); i >= now.getFullYear() - 40; i--) {
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
            $scope.current = false;
        }

        $scope.complete = $scope.data.complete;

        // converts a given datepicker month/year to javascript date
        var convertToDate = function(year, month) {
            if (year && month) {
                return moment(month + ' 1 ' + year).format();
            }
        };

        $scope.submit = function(t) {
            this.data.complete = this.complete;

            // need to parse the month/year combination before submitting
            this.data.startedOn = convertToDate(this.startedOn.year, this.startedOn.month);

            if (!this.current || this.complete) {
                this.data.endedOn = convertToDate(this.endedOn.year, this.endedOn.month);
            }

            try {
                if (t === 'q') { // if this is a qualification
                    validationService.mustBeTrue(this.data.name, 'Qualification name should be defined');
                    validationService.mustBeTrue(this.data.issuedBy, 'Issued School/University/Institute should be defined');
                    if (this.complete)
                        validationService.mustBeTrue(this.data.startedOn <= this.data.endedOn, 'Start date should be before the end date');
                } else {
                    validationService.mustBeTrue(this.data.position, 'Your position must be defined');
                    validationService.mustBeTrue(this.data.organization, 'The organization you worked at must be defined');
                    if (!this.current)
                        validationService.mustBeTrue(this.data.startedOn <= this.data.endedOn, 'Start date should be before the end date');
                }

                validationService.mustBeTrue(this.data.startedOn, 'Started month should be defined');
            } catch (e) {
                return;
            }

            this.$close(data);
        };
    }
]);

controllers.controller('SkillModalInstanceCtrl', ['$scope', 'data',
    function($scope, data) {
        $scope.data = data;
    }
]);

controllers.controller('MeCtrl', ['$scope', '$http', '$location', '$modal', 'userService', 'notificationService', 'utilService', '$state',
    function($scope, $http, $location, $modal, userService, notificationService, utilService, $state) {

        if ($state.is('editProfile'))
            $scope.edit = true;

        $scope.getTimes = utilService.getTimes;

        var loadProfileStats = function() {
            userService.getProfileStats(function(err, stats) {
                if (err) {
                    notificationService.handleError(err.message);
                    return;
                }

                $scope.stats = stats;
            });
        };

        userService.getProfile(function(err, user) {
            if (err) {
                notificationService.handleError(err.message);
                return;
            }

            $scope.user = $scope.latestValid = user;
            loadProfileStats();
        });

        var bindAddEditModal = function(index, templateUrl, instanceController, collection) {
            var addition = angular.isUndefined(index); // add = true if this is new vs. an edit 

            // holds a copy of the referred object so that edits won't appear instantaneously
            // if it's an addition, returns a new object
            var objToManipulate = addition ? {} : _.clone(collection[index]);


            var modal = $modal.open({
                templateUrl: templateUrl,
                controller: instanceController,
                resolve: {
                    data: function() {
                        return objToManipulate;
                    }
                }
            });

            // when the user has clicked ok, either push the "new" object here
            // or change the existing object in the parent scope
            modal.result.then(function(manipulated) {
                if (addition) {
                    collection.push(manipulated);
                } else {
                    collection[index] = manipulated;
                }

                $scope.saveProfile();
            });
        };

        $scope.convertGender = function(gender) {
            if (gender)
                return 'Male';
            else if (gender === false)
                return 'Female';
        };

        $scope.saveProfile = function() {
            userService.saveProfile($scope.user, function(err) {
                if (err) {
                    notificationService.handleError(err.message);
                } else {
                    $scope.latestValid = $scope.user;
                    loadProfileStats();
                    notificationService.notify({
                        title: 'Change(s) saved!',
                        text: 'Successfully saved change(s) made to your profile.',
                        type: 'success',
                        hide: true
                    });
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
                if (personalData.dateOfBirth) profile.dateOfBirth = new Date(personalData.dateOfBirth);
                profile.gender = personalData.gender;

                $scope.saveProfile();
            });
        };


        // qualification modal
        $scope.openQualificationModal = function(index) {
            bindAddEditModal(index, 'partials/modal_me_qualification.html', 'QualificationTenureModalInstanceCtrl', $scope.user.qualifications);
        };

        // tenure modal
        $scope.openTenureModal = function(index) {
            bindAddEditModal(index, 'partials/modal_me_tenure.html', 'QualificationTenureModalInstanceCtrl', $scope.user.tenures);
        };

        // skills modal
        $scope.openSkillModal = function(index) {
            bindAddEditModal(index, 'partials/modal_me_skill.html', 'SkillModalInstanceCtrl', $scope.user.skills);
        };

        // deletes any element by position of the collection after seeking user confirmation
        $scope.openDeleteModal = function(pos, collection) {
            var modal = $modal.open({
                templateUrl: 'partials/modal_me_confirmation.html'
            });

            modal.result.then(function() {
                if (~pos) collection.splice(pos, 1);

                $scope.saveProfile();
            });
        };

    }
]);

controllers.controller('CreateOrgCtrl', ['$scope', '$http', 'orgService', '$location', 'userService', 'notificationService',
    function($scope, $http, orgService, $location, userService, notificationService) {

        $scope.submit = function(org, admin) {
            orgService.createOrg(org, function(err, data) {
                if (!err) {
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
                        password: admin.pass,
                        affiliation: data.id
                    };

                    userService.create(user, function(err) {
                        if (!err) {
                            notificationService.notify({
                                title: 'Admin account created!',
                                text: 'Please check your e-mail inbox and click the confirmation link, please.',
                                type: 'success',
                                hide: true
                            });
                        } else if (err === 409) {
                            notificationService.notify({
                                title: 'Account already exists!',
                                text: 'We already have an account for ' + user.email + '. Please select another email for your admin account instead.',
                                type: 'error',
                                hide: true
                            });
                        } else {
                            $location.url('/500');
                        }
                    });
                } else if (err.message) {
                    notificationService.notify({
                        title: 'Ooops!',
                        text: err.message,
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

controllers.controller('EditOrgCtrl', [
    '$scope',
    'orgService',
    '$rootScope',
    'notificationService',
    'GRIZZLY_URL',
    'userService',
    function($scope, orgService, $rootScope, notificationService) {
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
            }


        };

        $scope.submit = function(org) {
            orgService.editOrg($rootScope.u.affiliation, org)
                .success(function() {
                    notificationService.handleSuccess('Organization details updated');
                });
        };
    }
]);

controllers.controller('ViewOrgCtrl', ['$scope', 'userService', 'orgService', '$rootScope', 'notificationService',
    function($scope, userService, orgService, $rootScope, notificationService) {
        orgService.getAds($rootScope.u.affiliation, function(err, data) {
            if (err) {
                notificationService.handleError(err.message);
                return;
            }

            $scope.campaigns = data.advertisements;
        });
    }
]);

controllers.controller('ViewCampaignCtrl', ['$scope', 'userService', 'orgService', '$rootScope', 'notificationService', 'adService', '$stateParams', 'searchService', 'adResponseService',
    function($scope, userService, orgService, $rootScope, notificationService, adService, $stateParams, searchService, adResponseService) {
        $scope.selectedCandidate = [];

        $scope.gridOptions = {
            data: 'responses',
            showGroupPanel: true,
            selectedItems: $scope.selectedCandidate,
            multiselect: false,
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
            if ($scope.selectedCandidate.length === 0)
                return;

            $scope.data = {};

            userService.getProfile($scope.selectedCandidate[0].user, function(err, data) {
                if (err) {
                    notificationService.handleError(err.message);
                    return;
                }

                $scope.user = data;
            });
        });

        adService.getAd($rootScope.u.affiliation, $stateParams.adId, function(err, data) {
            if (err)
                notificationService.handleError(err.message);

            $scope.ad = data.advertisement;
            $scope.ad.name = $scope.ad.jobRole + '-' + moment($scope.ad.createdOn).format('MMM DD');
        });

        searchService.getSearchForAd($rootScope.u.affiliation, $stateParams.adId, function(err, data) {
            if (err)
                notificationService.handleError(err.message);

            $scope.search = data.search;
        });

        adResponseService.getAllResponses($rootScope.u.affiliation, $stateParams.adId, function(err, data) {
            if (err)
                notificationService.handleError(err.message);

            $scope.responses = _.map(data.responses, function(r) {
                return {
                    id: r._id,
                    user: r.user._id ? r.user._id : r.user,
                    name: r.user.lastName ? r.user.firstName + ' ' + r.user.lastName : '[undisclosed]',
                    status: r.status,
                    updated: moment(r.lastUpdatedOn).fromNow(),
                    tags: r.tags.join(', ')
                };
            });
        });

        $scope.save = function(response, status, tags) {
            adResponseService.editResponse($rootScope.u.affiliation, $stateParams.adId, response.id, status, tags, function(err) {
                if (err) {
                    notificationService.handleError(err.message);
                    return;
                }

                notificationService.handleSuccess('Successfully updated the candidate');
            });
        };
    }
]);

controllers.controller('CreateAdCtrl', ['$scope',
    'orgService',
    'userService',
    'adService',
    'notificationService',
    '$location',
    '$stateParams',
    '$state',

    function($scope, orgService, userService, adService, notificationService, $location, $stateParams, $state) {

        // initiate the organization details
        orgService.getOrg(userService.user().affiliation)
            .success(function(data) {
                $scope.org = data.organization;
            }).error(function(err) {
                notificationService.handleError(err.message);
            });

        $scope.ad = {};
        $scope.ad.questions = [{}];

        // if state.current is edit, we need to transform the ad properties and fill the $scope.ad
        if ($state.is('editAdvertisement')) {
            $scope.heading = 'Edit Advertisement';

            adService.getAd(userService.user().affiliation, $stateParams.adId, function(err, data) {
                if (err)
                    notificationService.handleError(err.message);

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

            if ($state.is('createAdvertisement'))
                adService.createAd(userService.user().affiliation, ad, function(err, data) {
                    if (err) {
                        notificationService.handleError(err.message);
                    } else {
                        $location.url('/organization/ad/' + data.id + '/view');
                    }
                });
            else
                adService.editAd(userService.user().affiliation, $scope.ad.id, ad, function(err) {
                    if (err) {
                        notificationService.handleError(err.message);
                    } else {
                        $location.url('/organization/ad/' + $scope.ad.id + '/view');
                    }
                });
        };
    }
]);

controllers.controller('ViewAdCtrl', ['$scope', 'orgService', 'adService', '$stateParams', 'userService', 'notificationService',
    function($scope, orgService, adService, $stateParams, userService, notificationService) {
        $scope.org = {};
        $scope.ad = {};

        adService.getAd(userService.user().affiliation, $stateParams.adId, function(err, data) {
            if (err)
                notificationService.handleError(err.message);
            else {
                $scope.ad = data.advertisement;
            }
        });

        orgService.getOrg(userService.user().affiliation)
            .success(function(data) {
                $scope.org = data.organization;
            }).error(function(err) {
                notificationService.handleError(err.message);
            });
    }
]);

controllers.controller('ViewPublicAdCtrl', ['$scope', 'orgService', 'adService', '$stateParams', 'userService', 'notificationService', 'adResponseService', '$rootScope',
    function($scope, orgService, adService, $stateParams, userService, notificationService, adResponseService, $rootScope) {
        $scope.org = {};
        $scope.ad = {};

        $scope.apply = function() {
            adResponseService.createResponse($rootScope.u._id, $scope.org._id, $scope.ad._id, null, function(err) {
                if (err) {
                    notificationService.handleError(err.message);
                    return;
                }

                notificationService.handleSuccess('Saved your application successfully');

                $scope.status = 'applied';
            });
        };

        var getAdvertisement = function(method) {
            method($stateParams.orgId, $stateParams.adId, function(err, data) {
                if (err)
                    notificationService.handleError(err.message);
                else {
                    $scope.ad = data.advertisement;
                }
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
                    }

                    getAdvertisement(adService.getAd);
                } else {
                    getAdvertisement(adService.getAdPublic);
                }
            }).error(function(err) {
                notificationService.handleError(err.message);
            });
        } else {
            getAdvertisement(adService.getAdPublic);
        }

        orgService.getOrg($stateParams.orgId)
            .success(function(data) {
                $scope.org = data.organization;
            }).error(function(err) {
                notificationService.handleError(err.message);
            });
    }
]);

controllers.controller('SearchCtrl', ['$scope', '$rootScope', '$stateParams', 'userService', 'adService', 'searchService', 'notificationService', 'validationService', '$modal', '$location', 'adResponseService',
    function($scope, $rootScope, $stateParams, userService, adService, searchService, notificationService, validationService, $modal, $location, adResponseService) {
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

        $scope.ad = {};
        $scope.searchId = $stateParams.searchId;

        $scope.search = {
            criteria: []
        };

        // if this is a edit
        if ($scope.searchId) {
            searchService.getSearch(userService.user().affiliation, $scope.searchId, function(err, data) {
                if (err)
                    notificationService.handleError(err.message);
                else {
                    $scope.search = data.search;

                    // generating display names for the criteria.. i.e. AGE_BETWEEN -> Age between
                    for (var i = 0; i < $scope.search.criteria.length; i++) {
                        $scope.search.criteria[i].displayName = $scope.displayNameCollection[$scope.search.criteria[i].name].name;
                    }
                }
            });
        }

        adService.getAd(userService.user().affiliation, $stateParams.adId, function(err, data) {
            if (err)
                notificationService.handleError(err.message);
            else {
                $scope.ad = data.advertisement;
                $scope.search.name = $scope.ad.jobRole + ' - ' + moment($scope.ad.publishedOn).format('MMM YY');
            }
        });

        var resetCriterion = function() {
            $scope.criterion = {
                values: [],
                weight: 1
            };
        };

        resetCriterion();

        var saveSearch = function() {
            var search = {
                advertisement: $stateParams.adId,
                // note that name changes if the expiration date is extended
                name: $scope.search.name,
                criteria: $scope.search.criteria
            };

            // if this is a new search
            if (!$scope.searchId) {
                searchService.createSearch(userService.user().affiliation, search, function(err, data) {
                    if (err)
                        notificationService.handleError(err.message);
                    else {
                        notificationService.handleSuccess('Search updated successfully.');
                        $location.url('/organization/ad/' + $scope.ad.id + '/search/' + data.id);
                    }
                });
            } else {
                searchService.editSearch(userService.user().affiliation, $scope.searchId, search, function(err) {
                    if (err)
                        notificationService.handleError(err.message);
                    else
                        notificationService.handleSuccess('Search updated successfully.');
                });
            }
        };


        $scope.add = function(criterion) {
            try {
                validationService.mustBeTrue(criterion.name, 'Search criterion type is required');
                validationService.mustBeTrue(criterion.values[0], 'Search values should be defined');
                if ($scope.displayNameCollection[criterion.name].isRange) {
                    validationService.mustBeTrue(criterion.values[1], 'Search value range should be defined');
                    // if the user is going to define filter criteria like age and years of experience more than once
                    validationService.mustBeTrue(!(_.find($scope.search.criteria, function(c) {
                        return c.name == $scope.criterion.name;
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

        $scope.invite = function(id, tags) {
            adResponseService.createResponse(id, this.$parent.u.affiliation, $stateParams.adId, tags, function(err) {
                if (err) {
                    notificationService.handleError(err.message);
                    return;
                }

                $scope.user.invited = true;

                notificationService.handleSuccess('Candidate was invited successfully');

                markInvitedCandidates($scope.allResults);
            });
        };

        $scope.loadProfile = function(id, invited) {
            userService.getProfile(id, function(err, data) {
                if (err) {
                    notificationService.handleError(err.message);
                    return;
                }

                $scope.user = data;
                $scope.user.id = id;
                $scope.user.invited = invited;
            });
        };

        $scope.showTop = function(count) {
            $scope.limitResultsTo = count;
        };

        function markInvitedCandidates(results) {
            adResponseService.getAllResponses($rootScope.u.affiliation, $stateParams.adId, function(err, data) {
                if (err) {
                    notificationService.handleError(err.message);
                    return;
                }

                var invitedList = _.pluck(data.responses, 'user');
                var fullList = _.pluck(results, '_id');

                var resultsToBeMarked = _.intersection(invitedList, fullList);

                for (var i = 0; i < resultsToBeMarked.length; i++) {
                    for (var j = 0; j < results.length; j++) {
                        if (resultsToBeMarked[i] == results[j]._id) {
                            results[j].invited = true;
                            continue;
                        }
                    }
                }
            });
        }

        $scope.doSearch = function() {
            searchService.getSearchResults(userService.user().affiliation, $scope.searchId, function(err, data) {
                if (err) {
                    notificationService.handleError(err.message);
                } else {
                    if (data.scores.hits.hits.length !== 0) {
                        $scope.allResults = data.scores.hits.hits;
                        markInvitedCandidates(data.scores.hits.hits);
                        $scope.showTop(10);
                    } else
                        notificationService.handleInfo('No candidates found matching that criteria', 'Nothing to show!');
                }
            });
        };
    }
]);

controllers.controller('LogoutCtrl', ['$scope', 'userService',
    function($scope, userService) {
        userService.logout();
    }
]);

controllers.controller('MeDashboardCtrl', ['$scope', 'userService', '$rootScope', 'notificationService', '$modal', 'adResponseService',
    function($scope, userService, $rootScope, notificationService, $modal, adResponseService) {
        $scope.responses = [];

        $scope.hasActive = false;
        $scope.hasInactive = false;
        $scope.hasPending = false;


        var changeStatus = function(status, response, successMsg) {
            adResponseService.editResponse(response.advertisement.organization._id, response.advertisement._id, response._id, status, null, function(err) {
                if (err) {
                    notificationService.handleError(err.message);
                } else {
                    notificationService.handleSuccess(successMsg);
                    loadResponses();
                }
            });
        };

        $scope.accept = function(response) {
            var modal = $modal.open({
                templateUrl: 'partials/modal_response_accept.html'
            });

            modal.result.then(function() {
                changeStatus('accepted', response, 'You have successfully accepted the invitation from' + response.advertisement.organization.name);
            });

        };

        $scope.reject = function(response) {
            var modal = $modal.open({
                templateUrl: 'partials/modal_response_reject.html'
            });

            modal.result.then(function() {
                changeStatus('withdrawn', response, 'You have rejected the invitation from ' + response.advertisement.organization.name);
            });
        };

        $scope.withdraw = function(response) {
            var modal = $modal.open({
                templateUrl: 'partials/modal_response_withdraw.html'
            });

            modal.result.then(function() {
                changeStatus('withdrawn', response, 'You have withdrawn your application to ' + response.advertisement.organization.name);
            });
        };

        var loadResponses = function() {
            userService.getResponses().success(function(data) {
                if (data.responses.length === 0) {
                    notificationService.handleInfo('You do not have any active applications', 'No applications');
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
            }).error(function(err) {
                notificationService.handleError(err.message);
            });
        };

        loadResponses();
    }
]);

controllers.controller('JobBoardCtrl', ['$scope', 'adService', 'notificationService', '$location',
    function($scope, adService, notificationService, $location) {
        $scope.ads = [];

        adService.getAdsPublic(function(err, data) {
            if (err) {
                notificationService.handleError(err.message);
                return;
            }

            $scope.ads = data.ads;
        });

        $scope.goto = function(ad) {
            $location.url('/organization/' + ad.organization._id + '/post/' + ad._id + '/public');
        };
    }
]);

controllers.controller('NotificationsNavCtrl', ['$scope', '$rootScope', 'subwayService', 'notificationService', '$location',
    function($scope, $rootScope, subwayService, notificationService, $location) {
        $scope.markAsRead = function(notification) {
            subwayService.markAsRead(notification._id).success(function(data) {
                $rootScope.$broadcast('refreshNotifications');
                $rootScope.notifications = data;
            }).error(function(data) {
                notificationService.handleError(data.message);
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
                $location.path(path);
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
                })
                .error(function(err) {
                    notificationService.handleError(err.message);
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
                })
                .error(function(err) {
                    notificationService.handleError(err.message);
                });
        };
    }
]);