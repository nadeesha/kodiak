'use strict';


// Declare app level module which depends on filters, and services
var app = angular.module('kodiak', ['kodiak.filters', 'kodiak.services', 'kodiak.directives', 'kodiak.controllers', 'ui.state', 'ngStorage']);

app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {

	//$locationProvider.html5Mode(true);

	$urlRouterProvider.otherwise('/');

	$stateProvider
		.state('home', {
			url: '/',
			templateUrl: 'partials/landing.html'
		});

	$stateProvider
		.state('signup', {
			url: '/signup',
			templateUrl: 'partials/signup.html',
			controller: 'SignupCtrl'
		});

	$stateProvider
		.state('login', {
			url: '/login',
			templateUrl: 'partials/login.html',
			controller: 'LoginCtrl'
		});

	$stateProvider
		.state('activate', {
			url: '/activate',
			templateUrl: 'partials/activate.html',
			controller: 'ActivateCtrl'
		});

	$stateProvider
		.state('me', {
			url: '/me',
			templateUrl: 'partials/me.html',
			controller: 'MeCtrl'
		});
	// .state('route1', {
	// 	url: '/route1',
	// 	templateUrl: 'partials/partial1.html'
	// })
	// .state('route1.list', {
	// 	url: '/list',
	// 	templateUrl: 'route1.list.html',
	// 	controller: function($scope) {
	// 		$scope.items = ['A', 'List', 'Of', 'Items'];
	// 	}
	// })
	// .state('route2', {
	// 	url: '/route2',
	// 	templateUrl: 'partials/partial2.html'
	// })
	// .state('route2.list', {
	// 	url: '/list',
	// 	templateUrl: 'route2.list.html',
	// 	controller: function($scope) {
	// 		$scope.things = ['A', 'Set', 'Of', 'Things'];
	// 	}
	// })
})

// app.run(function($rootScope, $location) {

// 	// register listener to watch route changes
// 	$rootScope.$on("$locationChangeStart", function(event, next, current) {
// 		if (sessionStorage.restorestate == "true") {
// 			$rootScope.$broadcast('restorestate'); //let everything know we need to restore state
// 			sessionStorage.restorestate = false;
// 		}

// 		if ($rootScope.loggedUser == null) {
// 			// no logged user, we should be going to #login
// 			if (next.templateUrl != "partials/login.html") {
// 				// not going to #login, we should redirect now
// 				$location.path("/login");
// 			}
// 		}
// 	});
// })