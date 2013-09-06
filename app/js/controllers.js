'use strict';

/* Controllers */

var controllers = angular.module('kodiak.controllers', ['kodiak.configs']);

controllers.controller('SignupCtrl', ['$scope', '$http', '$location', 'userService',
	function($scope, $http, $location, userService) {
		$scope.response = {
			success: false,
			conflict: false
		},
		$scope.create = function(user) {
			userService.create(user, function (err) {
				if(!err) {
					$scope.response.success = true;
					$scope.response.conflict = false;
				}
				else if (err === 409) {
					$scope.response.success = false;
					$scope.response.conflict = true;
				}
				else {
					$location.url('/500');
				}
			});
		}
	}
]);

controllers.controller('LoginCtrl', ['$scope', '$http', '$location', 'userService',
	function($scope, $http, $location, userService) {
		$scope.response = {
			incorrect: false,
			inactive: false
		},
		$scope.validate = function(user) {
			userService.login(user, function (err) {
				if(!err) {
					$location.url('/me');
				}
				else if (err === 401) {
					$scope.response.incorrect = true;
					$scope.response.inactive = false;
				}
				else if (err === 403) {
					$scope.response.incorrect = false;
					$scope.response.inactive = true;
				}
				else {
					$location.url('/500');
				}
			})
		}
	}
]);

controllers.controller('ActivateCtrl', ['$scope', '$http', '$location', 'userService',
	function($scope, $http, $location, userService) {
		$scope.response = {
			incorrect: false,
			success: false
		};
		var user = {
			email : ($location.search()).email,
			token : ($location.search()).token
		};

		userService.activate(user, function(err) {
			if (!err) {
				$scope.response.incorrect = false;
				$scope.response.success = true;
			}
			else if (err === 400) {
				$scope.response.incorrect = false;
				$scope.response.success = true;
			}
			else {
				$location.url('/500');
			}
		});
	}
]);