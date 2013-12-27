'use strict';


// Declare app level module which depends on filters, and services
var app = angular.module('kodiak', ['kodiak.filters', 'kodiak.services', 'kodiak.directives', 'kodiak.controllers', 'ui.state', 'ui.bootstrap', 'ui.date', 'ngStorage', 'ui.slider', 'textAngular', 'ngSanitize', 'ngProgress', 'chieffancypants.loadingBar', 'ngGrid']);

app.config(function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, cfpLoadingBarProvider) {

    cfpLoadingBarProvider.includeSpinner = true;

    // enable xhr
    $httpProvider.defaults.useXDomain = true;

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
        .state('myApplications', {
            url: '/me/applications',
            templateUrl: 'partials/dashboard_me.html',
            controller: 'MeDashboardCtrl'
        });

    $stateProvider
        .state('jobBoard', {
            url: '/ads',
            templateUrl: 'partials/ads_public.html',
            controller: 'JobBoardCtrl'
        });

    $stateProvider
        .state('editProfile', {
            url: '/me/edit',
            templateUrl: 'partials/me.html',
            controller: 'MeCtrl'
        });

    $stateProvider
        .state('viewProfile', {
            url: '/me/view',
            templateUrl: 'partials/me.html',
            controller: 'MeCtrl'
        });

    $stateProvider
        .state('createOrganization', {
            url: '/organization/create',
            templateUrl: 'partials/organization_create.html',
            controller: 'CreateOrgCtrl'
        });

    $stateProvider
        .state('organizationDashboard', {
            url: '/organization/dashboard',
            templateUrl: 'partials/dashboard_org.html',
            controller: 'ViewOrgCtrl'
        });

    $stateProvider
        .state('campaignHome', {
            url: '/organization/campaign/:adId',
            templateUrl: 'partials/campaign_home.html',
            controller: 'ViewCampaignCtrl'
        });

    $stateProvider
        .state('createAdvertisement', {
            url: '/organization/ad/create',
            templateUrl: 'partials/ad_create.html',
            controller: 'CreateAdCtrl'
        });

    $stateProvider
        .state('viewAdvertisement', {
            url: '/organization/ad/{adId}/view',
            templateUrl: 'partials/ad_view.html',
            controller: 'ViewAdCtrl'
        });

    $stateProvider
        .state('viewAdvertisementPublic', {
            url: '/organization/{orgId}/post/{adId}/public',
            templateUrl: 'partials/post_view_public.html',
            controller: 'ViewPublicAdCtrl'
        });

    $stateProvider
        .state('editAdvertisement', {
            url: '/organization/ad/{adId}/edit',
            templateUrl: 'partials/ad_create.html',
            controller: 'CreateAdCtrl'
        });

    $stateProvider
        .state('createSearch', {
            url: '/organization/ad/{adId}/search/create',
            templateUrl: 'partials/search.html',
            controller: 'SearchCtrl'
        });

    $stateProvider
        .state('viewSearch', {
            url: '/organization/ad/{adId}/search/{searchId}',
            templateUrl: 'partials/search.html',
            controller: 'SearchCtrl'
        });

    $stateProvider
        .state('logout', {
            url: '/logout',
            templateUrl: 'partials/logout.html',
            controller: 'LogoutCtrl'
        });

});

app.run(function($rootScope, userService) {
    $rootScope.$on('restorestate', userService.restoreState);
    $rootScope.$on('logout', userService.logout);
    $rootScope.$broadcast('restorestate');
});