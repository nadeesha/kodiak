angular.module('kodiak').controller('SearchCtrl', function($scope, $rootScope,
    $stateParams, userService, adService, searchService, notificationService,
    validationService, $modal, $location, adResponseService, $state) {

    'use strict';

    var userOrg = $rootScope.u.affiliation;

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
        }
    };

    $scope.ad = null;
    $scope.searchId = $stateParams.searchId;
    $scope.searchCreated = false; // fix for a phantom promise return

    function initiate(data) {
        $scope.search = data.search;

        if (!$scope.search.criteria) {
            $scope.search.criteria = [];
        }

        for (var i = 0; i < $scope.search.criteria.length; i++) {
            $scope.search.criteria[i].displayName =
                $scope.displayNameCollection[$scope.search.criteria[i].name].name;
        }

        loadResultsView();
    }

    function createSearch() {
        adService.getAd(userOrg, $stateParams.adId)
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

                searchService.createSearch(userOrg, search)
                    .success(function(data) {
                        searchService.getSearch(userOrg, data.id)
                            .success(initiate);
                    });
            });
    }

    searchService.getSearchForAd(userOrg, $stateParams.adId)
        .success(initiate).error(createSearch);

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

        searchService.editSearch(userOrg, $scope.search.id, search)
            .success(function() {
                notificationService.handleSuccess('Search updated successfully.');
                $scope.$broadcast('doSearch');
            });
    };

    function validate(criterion) {
        try {
            validationService.mustBeTrue(criterion.name,
                'Search criterion type is required');

            validationService.mustBeTrue(criterion.values[0],
                'Search values should be defined');

            if ($scope.displayNameCollection[criterion.name].isRange) {
                validationService.mustBeTrue(criterion.values[1],
                    'Search value range should be defined');

                // if the user is going to define filter criteria like age and years of experience
                // more than once
                validationService.mustBeTrue(!(_.find($scope.search.criteria, function(c) {
                    return c.name === $scope.criterion.name;
                })), 'You can not specify multiple search criteria of this kind');
            }
        } catch (e) {
            return false;
        }

        return true;
    }

    $scope.add = function(criterion) {
        if (!validate(criterion)) {
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

    function loadResultsView() {
        $state.go('search.results', {});
        $scope.$broadcast('setInitialData', {
            adId: $scope.search.advertisement,
            searchId: $scope.search.id
        });
    }

    $scope.taunts = {
        1: 'not so much',
        2: 'not so much',
        3: 'somewhat important',
        4: 'somewhat important',
        5: 'very important',
        6: 'very important',
        7: 'extremely important'
    };

    $scope.$on('getInitialData', function () {
        $scope.$broadcast('initialData', {
            searchId: $scope.search.id,
            adId: $scope.search.advertisement
        });
    });
});
