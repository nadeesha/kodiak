'use strict';

/* Directives */
angular.module('kodiak.directives', [])
    .directive('bsNavbar', function($location) {
        return {
            restrict: 'A',
            link: function postLink(scope, element, attrs, controller) {
                // Watch for the $location
                scope.$watch(function() {
                    return $location.path();
                }, function(newValue, oldValue) {

                    $('li[data-match-route]', element).each(function(k, li) {
                        var $li = angular.element(li),
                            // data('match-route') does not work with dynamic attributes
                            pattern = $li.attr('data-match-route'),
                            regexp = new RegExp('^' + pattern + '$', ['i']);

                        if (regexp.test(newValue)) {
                            $li.addClass('active');
                            var $collapse = $li.find('.collapse.in');
                            if ($collapse.length) $collapse.collapse('hide');
                        } else {
                            $li.removeClass('active');
                        }

                    });
                });
            }
        };
    })
    .directive('grAd', [

        function() {
            return {
                // name: '',
                // priority: 1,
                // terminal: true,
                scope: true, // {} = isolate, true = child, false/undefined = no change
                controller: function($scope, $sce) {
                    $scope.postedOn = moment().calendar();
                    $scope.ad.description = $sce.trustAsHtml($scope.ad.description);
                    $scope.expiresOn = function() {
                        return moment($scope.ad.expiredOn).calendar();
                    };
                },
                // require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
                restrict: 'A', // E = Element, A = Attribute, C = Class, M = Comment
                // template: '',
                templateUrl: 'partials/template_ad.html'
                // replace: true,
                // transclude: true
                // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
                // link: function($scope) {

                // }
            };
        }
    ])
    .directive('grVisualizedProfile', [

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

                            var years = moment(endedOn).diff(moment(startedOn), 'years') * 3;
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
    ])
    .directive('grAvatar', ['utilService',
        function(utilService) {
            return {
                scope: {
                    email: "@",
                    size: "@"
                },
                link: function(scope, element, attrs) {
                    scope.$watch(attrs, function() {
                        if (attrs.email) {
                            element.context.src = "http://www.gravatar.com/avatar/" + utilService.md5(attrs.email) + ".jpg?s=" + attrs.size;
                        }
                    });
                },
                restrict: 'A'
            }
        }
    ])
    .directive('amTimeAgo', ['$window',
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

                if (angular.isDefined(attr.amWithoutSuffix)) {
                    scope.$watch(attr.amWithoutSuffix, function(value) {
                        if (typeof value === 'boolean') {
                            withoutSuffix = value;
                            updateMoment();
                        } else {
                            withoutSuffix = amTimeAgoConfig.withoutSuffix;
                        }
                    });
                }

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
    ])