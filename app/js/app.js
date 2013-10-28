'use strict';


// Declare app level module which depends on filters, and services
var app = angular.module('kodiak', ['kodiak.filters', 'kodiak.services', 'kodiak.directives', 'kodiak.controllers', 'ui.state', 'ui.bootstrap', 'ui.date', 'ngStorage', 'ui.slider']);

app.config(function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {

    // enable xhr
    $httpProvider.defaults.useXDomain = true;

    // xsrf config
    $httpProvider.defaults.xsrfCookieName = 'XSRF-TOKEN';
    $httpProvider.defaults.xsrfHeaderName = 'x-csrf-token';

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
        .state('profile', {
            url: '/me',
            templateUrl: 'partials/me.html',
            controller: 'MeCtrl'
        });

    $stateProvider
        .state('organization_create', {
            url: '/organization/create',
            templateUrl: 'partials/organization_create.html',
            controller: 'CreateOrgCtrl'
        });

    $stateProvider
        .state('organization_dashboard', {
            url: '/organization/dashboard',
            templateUrl: 'partials/organization_dashboard.html',
            controller: 'ViewOrgCtrl'
        });

    $stateProvider
        .state('organization_ad_create', {
            url: '/organization/ad/create',
            templateUrl: 'partials/ad_create.html',
            controller: 'CreateAdCtrl'
        });

    $stateProvider
        .state('organization_ad_view', {
            url: '/organization/ad/{adId}/view',
            templateUrl: 'partials/ad_view.html',
            controller: 'ViewAdCtrl'
        });

    $stateProvider
        .state('organization_ad_edit', {
            url: '/organization/ad/{adId}/edit',
            templateUrl: 'partials/ad_create.html',
            controller: 'CreateAdCtrl'
        });

    $stateProvider
        .state('organization_search_create', {
            url: '/organization/ad/{adId}/search/create',
            templateUrl: 'partials/search.html',
            controller: 'SearchCtrl'
        });

    $stateProvider
        .state('organization_search_view', {
            url: '/organization/ad/{adId}/search/{searchId}/view',
            templateUrl: 'partials/search.html',
            controller: 'SearchCtrl'
        });

});

// app.run(function($rootScope, userService) {
//     $rootScope.$on('$stateChangeStart', function(event, next, current) {
//         if (!sessionStorage.restored) {
//             $rootScope.$broadcast('restorestate'); //let everything know we need to restore state
//             sessionStorage.restored = true;
//         }
//     });
// });