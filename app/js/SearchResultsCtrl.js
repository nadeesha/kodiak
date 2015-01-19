angular.module('kodiak').controller('SearchResultsCtrl', function($scope, searchService,
    $rootScope, adResponseService, $state, userService, notificationService) {
    'use strict';

    // this flag hides  and shows some stuff in the limited profile
    // intended for candidates
    $scope.forEmployer = true;

    $scope.doSearch = function() {
        searchService.getSearchResults($rootScope.u.affiliation, $scope.search.id)
            .success(function(data) {
                $scope.$emit('getInitialData');

                if (data.scores.hits.hits.length !== 0) {
                    searchService.getSearch($rootScope.u.affiliation, $scope.search.id)
                        .success(function() {
                            markInvitedCandidates(data.scores.hits.hits);
                        });

                    $scope.allResults = data.scores.hits.hits;
                    $scope.showTop(10);
                } else {
                    $scope.allResults = [];
                    notificationService.handleInfo('No candidates found matching that criteria',
                        'Sorry!');
                }
            });
    };

    $scope.invite = function(id, tags) {
        adResponseService.createResponse(id, this.$parent.u.affiliation, $scope.search.advertisement, tags)
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

                return searchService.hitUser($rootScope.u.affiliation, $scope.search.id, {
                    user: {
                        _id: $scope.user.id
                    }
                });
            });
    };

    $scope.showTop = function(count) {
        $scope.limitResultsTo = count;
    };

    function markInvitedCandidates(results) {
        adResponseService.getAllResponses($rootScope.u.affiliation, $scope.search.advertisement)
            .success(function(data) {
                var invitedList = _.pluck(_.pluck(data.responses, 'user'), '_id');
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

    $scope.doSearch();

    $scope.$on('doSearch', function() {
        $scope.doSearch();
    });

    $scope.$on('initialData', function (data) {
        $scope.search = data.targetScope.search;
    });
});
