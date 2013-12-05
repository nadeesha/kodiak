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
                controller: function($scope) {
                    $scope.postedOn = moment().calendar();
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