'use strict';

/* Directives */
var directives = angular.module('kodiak.directives', []);

directives.directive('grAd', [

    function() {
        return {
            scope: true, // {} = isolate, true = child, false/undefined = no change
            controller: function($scope, $sce) {
                $scope.postedOn = $scope.ad.postedOn;
                $scope.ad.description = $sce.trustAsHtml($scope.ad.description);
                $scope.expiresOn = function() {
                    return moment($scope.ad.expiredOn).calendar();
                };
            },
            restrict: 'A', // E = Element, A = Attribute, C = Class, M = Comment
            templateUrl: 'partials/template_ad.html'
        };
    }
]);

directives.directive('grVisualizedProfile', [

    function() {
        return {
            // name: '',
            // priority: 1,
            // terminal: true,
            scope: true, // {} = isolate, true = child, false/undefined = no change
            controller: function($scope, $element, $attrs, utilService) {
                $scope.view = {
                    getDuration: function(startedOn, endedOn) {
                        if (!startedOn)
                            return;

                        if(!endedOn)
                            endedOn = Date.now();

                        return {
                            years: moment(endedOn).diff(startedOn, 'years'),
                            months: moment(endedOn).diff(startedOn, 'months') % 12,
                        };
                    },
                    currentYear: function() {
                        return moment().year();
                    },
                    getTimesForDate: function(startedOn, endedOn) {
                        if (!startedOn)
                            return;

                        if(!endedOn) {
                            endedOn = Date.now();
                        }

                        var years = moment(endedOn).diff(moment(startedOn), 'years') * 2;

                        if (years === 0) {
                          years = 1; // just give one circle if it's less than a year
                        }

                        return new Array(years);
                    },
                    getTimes: utilService.getTimes,
                    getTotalExperience: function() {
                        if (!$scope.user || !$scope.user.tenures)
                            return 0;

                        var earliest = _.min($scope.user.tenures, function(t) {
                            return new Date(t.startedOn).getTime();
                        });

                        return (moment().year() - moment(earliest.startedOn).year());
                    }
                };
            },
            // require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
            restrict: 'A', // E = Element, A = Attribute, C = Class, M = Comment
            // template: '',
            templateUrl: 'partials/template_visualized_profile.html'
            // replace: true,
            // transclude: true
            // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
            // link: function($scope) {

            // }
        };
    }
]);

directives.directive('grAvatar', [

    function() {
        return {
            scope: {
                email: '@',
                size: '@'
            },
            link: function(scope, element, attrs) {
                scope.$watch(attrs, function() {
                    if (attrs.email) {
                        // element.context.src = "http://www.gravatar.com/avatar/" + utilService.md5(attrs.email) + ".jpg?s=" + attrs.size;
                        element.context.src = 'http://www.gravatar.com/avatar/' + '.jpg?s=' + attrs.size;
                    }
                });
            },
            restrict: 'A'
        };
    }
]);

directives.directive('grSubway', [

    function() {
        return {
            restrict: 'A',
            controller: function($scope, $rootScope, subwayService, notificationService, $modal) {
                $scope.showNotifications = function() {
                    $modal.open({
                        templateUrl: 'partials/modal_notifications.html',
                        controller: 'NotificationsNavCtrl'
                    });
                };
            },
            templateUrl: 'partials/template_subway_nav.html'
        };
    }
]);

directives.directive('amTimeAgo', ['$window',
    function($window) {
        return function(scope, element, attr) {
            var activeTimeout = null;
            var currentValue;
            var currentFormat;
            var withoutSuffix = false;

            function cancelTimer() {
                if (activeTimeout) {
                    $window.clearTimeout(activeTimeout);
                    activeTimeout = null;
                }
            }

            function updateTime(momentInstance) {
                element.text(momentInstance.fromNow(withoutSuffix));
                var howOld = $window.moment().diff(momentInstance, 'minute');
                var secondsUntilUpdate = 3600;
                if (howOld < 1) {
                    secondsUntilUpdate = 1;
                } else if (howOld < 60) {
                    secondsUntilUpdate = 30;
                } else if (howOld < 180) {
                    secondsUntilUpdate = 300;
                }

                activeTimeout = $window.setTimeout(function() {
                    updateTime(momentInstance);
                }, secondsUntilUpdate * 1000);
            }

            function updateMoment() {
                cancelTimer();
                updateTime($window.moment(currentValue, currentFormat));
            }

            scope.$watch(attr.amTimeAgo, function(value) {
                if ((typeof value === 'undefined') || (value === null) || (value === '')) {
                    cancelTimer();
                    if (currentValue) {
                        element.text('');
                        currentValue = null;
                    }
                    return;
                }

                if (angular.isNumber(value)) {
                    // Milliseconds since the epoch
                    value = new Date(value);
                }
                // else assume the given value is already a date

                currentValue = value;
                updateMoment();
            });

            attr.$observe('amFormat', function(format) {
                currentFormat = format;
                if (currentValue) {
                    updateMoment();
                }
            });

            scope.$on('$destroy', function() {
                cancelTimer();
            });
        };
    }
]);

directives.directive('fileUploader', function() {
    return {
        restrict: 'E',
        transclude: true,
        template: '<input type="file" name="file" onchange="angular.element(this).scope().uploadFile(this.files)" enctype="multipart/form-data" accept={{acceptedtypes}} />',
        scope: '=',
        link: function($scope, $element, $attrs) {
            $scope.acceptedtypes = $attrs.acceptedtypes;
            console.log($scope);
            var fileInput = $element.find('input[type="file"]');
            fileInput.bind('change', function(e) {
                $scope.notReady = e.target.files.length === 0;
                $scope.files = [];
                for (var i in e.target.files) {
                    //Only push if the type is object for some stupid-ass reason browsers like to include functions and other junk
                    if (typeof e.target.files[i] == 'object') $scope.files.push(e.target.files[i]);
                }
            });
        }
    };
});

directives.directive('grAdPreview', function() {
    return {
        restrict: 'A',
        templateUrl: 'partials/template_ad_preview.html',
        scope: {
            ads: '=ads',
            searchText: '=searchText',
            org: '=org'
        }
    };
});
