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

controllers.controller('LoginCtrl', ['$scope', '$http', '$location', 'userService', 'notificationService',
    function($scope, $http, $location, userService, notificationService) {
        console.log($scope.user);
        $scope.validate = function(user) {
            console.log($scope.user);
            userService.login(user, function(err, data) {
                if (!err) {
                    if (!data.affiliation) {
                        $location.url('/me');
                    } else {
                        $location.url('/organization/dashboard');
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



// BEGIN: Screwed upModal Controllers

controllers.controller('PersonalModalInstanceCtrl', ['$scope', 'data', 'validationService',
    function($scope, data, validationService) {
        $scope.data = data;

        // parse date string -> Date()
        if ($scope.data.dateOfBirth)
            $scope.data.dateOfBirth = new Date($scope.data.dateOfBirth);

        $scope.dateOfBirthOptions = {
            changeYear: true,
            changeMonth: true,
            yearRange: '1900:-0',
            dateFormat: 'd MM yy'
        };

        $scope.submit = function() {
            try {
                if ($scope.data.dateOfBirth)
                    validationService.isTrue(moment($scope.data.dateOfBirth) < moment().subtract('years', 15), 'You must be at least 15 years old');
                if ($scope.data.contactNumber)
                    validationService.isTrue($scope.data.contactNumber.length >= 10, 'Contact Number should have 10 digits at least');
            } catch (e) {
                return;
            }

            $scope.$close(data);
        }
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

        // this needs to be executed for tenures only
        if (!data.complete && data.endedOn) {
            $scope.current = false;
        } else if (!data.complete && !data.endedOn) {
            $scope.current = true;
        }

        // reset the end date to null. applicable to "I currently work here" checkbox in tenure modal
        $scope.changeEndDate = function() {
            if (this.current) {
                this.endedOn = null;
                this.data.endedOn = null;
            } else {
                this.data.endedOn = this.endedOn;
            }
        }

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

        // converts a given datepicker month/year to javascript date
        var convertToDate = function(year, month) {
            if (year && month) {
                return moment(month + ' 1 ' + year).format();
            }
        }

        // wysiwyg text
        $scope.textAngularOpts = {
            toolbar: [{
                icon: "<i class='icon-bold'></i>",
                name: "b",
                title: "Bold"
            }, {
                icon: "<i class='icon-italic'></i>",
                name: "i",
                title: "Italics"
            }, {
                icon: "<i class='icon-list-ul'></i>",
                name: "ul",
                title: "Unordered List"
            }, {
                icon: "<i class='icon-list-ol'></i>",
                name: "ol",
                title: "Ordered List"
            }, {
                icon: "<i class='icon-rotate-right'></i>",
                name: "redo",
                title: "Redo"
            }, {
                icon: "<i class='icon-undo'></i>",
                name: "undo",
                title: "Undo"
            }],
            html: $scope.data.responsibilities
        };

        // $scope.textAngularOpts.textAngularEditors = {
        //     responsibilities: {
        //         html: $scope.data.responsibilities
        //     }
        // }

        $scope.$watch('textAngularOpts.textAngularEditors.responsibilities.html', function(newHTML, oldHTML) {
            $scope.data.responsibilities = newHTML;
        });

        // $scope.data.responsibilities = $scope.textAngularOpts.html;

        $scope.submit = function(t) {
            // need to parse the month/year combination before submitting
            this.data.startedOn = convertToDate(this.startedOn.year, this.startedOn.month);

            if (!this.current || this.complete) {
                this.data.endedOn = convertToDate(this.endedOn.year, this.endedOn.month);
            };

            try {
                if (t === 'q') { // if this is a qualification
                    validationService.isTrue(this.data.name, 'Qualification name should be defined');
                    validationService.isTrue(this.data.issuedBy, 'Issued School/University/Institute should be defined');
                    if (this.complete)
                        validationService.isTrue(this.data.startedOn <= this.data.endedOn, 'Start date should be before the end date');
                } else {
                    validationService.isTrue(this.data.position, 'Your position must be defined');
                    validationService.isTrue(this.data.organization, 'The organization you worked at must be defined');
                    if (!this.current)
                        validationService.isTrue(this.data.startedOn <= this.data.endedOn, 'Start date should be before the end date');
                }

                validationService.isTrue(this.data.startedOn, 'Started month should be defined');
            } catch (e) {
                return;
            }

            // if (!this.current && this.data.startedOn > this.data.endedOn) // check the date mismatches between startedOn and endedOn
            //     this.datesMismatch = true;
            // else
            this.$close(data);
        }
    }
]);

controllers.controller('SkillModalInstanceCtrl', ['$scope', 'data',
    function($scope, data) {
        $scope.data = data;
    }
]);

// END: Modal Controllers



controllers.controller('MeCtrl', ['$scope', '$http', '$location', '$modal', 'userService', 'notificationService', '$state',
    function($scope, $http, $location, $modal, userService, notificationService, $state) {

        if ($state.is('profileEdit'))
            $scope.edit = true;

        // get the height of the timeline div
        $scope.view = {
            getDuration: function(startedOn, endedOn) {
                if (!startedOn)
                    return;

                return {
                    years: moment(endedOn).diff(startedOn, 'years'),
                    months: moment(endedOn).diff(startedOn, 'months') % 12,
                }
            },
            currentYear: function() {
                return moment().year();
            },
            getTimesForDate: function(startedOn, endedOn) {
                if (!startedOn)
                    return;

                var years = moment(endedOn).diff(moment(startedOn), 'years') * 3;
                return new Array(years);
            },
            getTimes: function(n) {
                if (!n)
                    return;

                return new Array(Number(n));
            },
            getTotalExperience: function() {
                if (!$scope.user || !$scope.user.tenures)
                    return 0;

                var earliest = _.min($scope.user.tenures, function(t) {
                    return new Date(t.startedOn).getTime();
                });

                return (moment().year() - moment(earliest.startedOn).year());
            }
        }

        var loadProfileStats = function() {
            userService.getProfileStats(function(err, stats) {
                if (!err)
                    $scope.stats = stats;
                else
                    $location.url('/500');
            });
        }

        userService.getProfile(function(err, user) {
            if (!err) {
                $scope.user = $scope.latestValid = user;
                loadProfileStats();
            } else
                $location.url('/500');
        });

        var bindAddEditModal = function(index, templateUrl, instanceController, collection) {
            var addition = angular.isUndefined(index); // add = true if this is new vs. an edit 

            // holds a copy of the referred object so that edits won't appear instantaneously
            // if it's an addition, returns a new object
            var objToManipulate = addition ? new Object() : _.clone(collection[index]);


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
        }

        $scope.convertGender = function(gender) {
            if (gender)
                return 'Male';
            else if (gender == false)
                return 'Female';
        }

        $scope.saveProfile = function() {
            // if ($scope.user === $scope.latestValid) // if no change is done
            //     return; 

            userService.saveProfile($scope.user, function(err) {
                if (err) {
                    notificationService.handleError(err.message);
                } else {
                    $scope.latestValid = $scope.user;
                    loadProfileStats();
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
                        }
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
        }



        // qualification modal
        $scope.openQualificationModal = function(index) {
            bindAddEditModal(index, 'partials/modal_me_qualification.html', 'QualificationTenureModalInstanceCtrl', $scope.user.qualifications);
        }

        // tenure modal
        $scope.openTenureModal = function(index) {
            bindAddEditModal(index, 'partials/modal_me_tenure.html', 'QualificationTenureModalInstanceCtrl', $scope.user.tenures);
        }

        // skills modal
        $scope.openSkillModal = function(index) {
            bindAddEditModal(index, 'partials/modal_me_skill.html', 'SkillModalInstanceCtrl', $scope.user.skills);
        }

        // deletes any element by position of the collection after seeking user confirmation
        $scope.openDeleteModal = function(pos, collection) {
            var modal = $modal.open({
                templateUrl: 'partials/modal_me_confirmation.html'
            });

            modal.result.then(function() {
                if (~pos) collection.splice(pos, 1);

                $scope.saveProfile();
            })
        }

    }
]);

controllers.controller('CreateOrgCtrl', ['$scope', '$http', 'orgService', '$location', 'userService', 'notificationService',
    function($scope, $http, orgService, $location, userService, notificationService) {

        $scope.create = function(org, admin) {
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
                    }

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
        }
    }
]);

controllers.controller('ViewOrgCtrl', ['$scope', 'userService',
    function($scope, userService) {

    }
]);

controllers.controller('CreateAdCtrl', ['$scope', 'orgService', 'userService', 'adService', 'notificationService', '$location', '$stateParams', '$state',
    function($scope, orgService, userService, adService, notificationService, $location, $stateParams, $state) {
        // initiate the organization details
        orgService.getOrg(userService.user().affiliation, function(err, data) {
            $scope.org = data.organization;
        });

        // initiate the properties
        $scope.ad = {};
        $scope.ad.responsibilities = [{}];
        $scope.ad.requirements = [{}];
        $scope.ad.questions = [{}];

        // if state.current is edit, we need to transform the ad properties and fill the $scope.ad
        if ($state.is('organization_ad_edit')) {
            $scope.heading = 'Edit Advertisement';

            adService.getAd(userService.user().affiliation, $stateParams.adId, function(err, data) {
                if (err)
                    notificationService.handleError(err.message);

                $scope.ad = data.advertisement;

                // transforming the questions and requirements
                var r = $scope.ad.responsibilities;
                var q = $scope.ad.questions;

                // re-initialize $scope array holders
                $scope.ad.responsibilities = [];
                $scope.ad.questions = [];

                _.each(r, function(v) {
                    $scope.ad.responsibilities.push({
                        value: v
                    });
                });

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
            // transform responsibilities and questions to independent arrays.
            // currently they are nested under obj.value properties
            ad.responsibilities = _.pluck($scope.ad.responsibilities, 'value');
            ad.questions = _.pluck($scope.ad.questions, 'value');

            if ($state.is('organization_ad_edit'))
                adService.createAd(userService.user().affiliation, ad, function(err, data) {
                    if (err) {
                        notificationService.handleError(err.message);
                    } else {
                        $location.url('/organization/ad/' + data.id + '/view');
                    }
                });
            else
                adService.editAd(userService.user().affiliation, $scope.ad.id, ad, function(err, data) {
                    if (err) {
                        notificationService.handleError(err.message);
                    } else {
                        $location.url('/organization/ad/' + data.id + '/view');
                    }
                });
        }
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

        orgService.getOrg(userService.user().affiliation, function(err, data) {
            if (err)
                notificationService.handleError(err.message);
            else {
                $scope.org = data.organization;
            }
        });
    }
]);

controllers.controller('SearchCtrl', ['$scope', '$stateParams', 'userService', 'adService', 'searchService', 'notificationService', 'validationService', '$modal',
    function($scope, $stateParams, userService, adService, searchService, notificationService, validationService, $modal) {
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
        }

        $scope.ad = {};
        $scope.searchId = $stateParams.searchId;
        $scope.results = {};

        $scope.search = {
            criteria: []
        }

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
                    };
                }
            })
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
                        $scope.searchId = data.id;
                    }
                });
            } else {
                searchService.editSearch(userService.user().affiliation, $scope.searchId, search, function(err, data) {
                    if (err)
                        notificationService.handleError(err.message);
                    else
                        notificationService.handleSuccess('Search updated successfully.');
                });
            }
        };

        resetCriterion();

        $scope.add = function(criterion) {
            try {
                validationService.isTrue(criterion.name, 'Search criterion type is required');
                validationService.isTrue(criterion.values[0], 'Search values should be defined');
                if ($scope.displayNameCollection[criterion.name].isRange) {
                    validationService.isTrue(criterion.values[1], 'Search value range should be defined');
                    // if the user is going to define filter criteria like age and years of experience more than once
                    validationService.isTrue(!(_.find($scope.search.criteria, function(c) {
                        return c.name == $scope.criterion.name
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
            searchService.getSearchResults(userService.user().affiliation, $scope.searchId, function(err, data) {
                if (err)
                    notificationService.handleError(err.message);
                else {
                    var results = data.scores.hits;

                    var modal = $modal.open({
                        templateUrl: 'partials/modal_search_results.html',
                        controller: 'SearchResultsCtrl',
                        resolve: {
                            data: function() { // this needs to be a function
                                return results;
                            }
                        }
                    });

                    // modal.result.then(function(altered) {
                    //     if (addition) {
                    //         collection.push(altered);
                    //     } else {
                    //         obj = altered;
                    //     }

                    //     $scope.saveProfile();
                    // });
                }
            })
        }
    }
]);

controllers.controller('SearchResultsCtrl', ['$scope', 'data',
    function($scope, data) {
        $scope.allResults = data;

        $scope.results = [];

        $scope.showTop = function(count) {
            $scope.results = _.first($scope.allResults.hits, count);
        }

        // show the first 10 by default
        $scope.showTop(10);

        $scope.showInfo = function(id) {
            // body...
        }
    }
]);

controllers.controller('LogoutCtrl', ['$scope', 'userService',
    function($scope, userService) {
        userService.logout();
    }
]);