'use strict';


// Declare app level module which depends on filters, and services
var app = angular.module('kodiak', ['kodiak.filters', 'kodiak.services', 'kodiak.directives', 'kodiak.controllers', 'ui.state', 'ngStorage']);

app.config(function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
    
    $httpProvider.defaults.useXDomain = true;

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

});