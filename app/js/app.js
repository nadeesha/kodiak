'use strict';


// Declare app level module which depends on filters, and services
var app = angular.module('kodiak', ['kodiak.filters',
    'kodiak.services',
    'kodiak.directives',
    'kodiak.controllers',
    'ui.router',
    'ui.bootstrap',
    'ngStorage',
    'ui.slider',
    'textAngular',
    'ngSanitize',
    'ngProgress',
    'chieffancypants.loadingBar',
    'ngGrid'
]);

app.config(function($httpProvider, $provide) {
    $httpProvider.defaults.useXDomain = true;

    $provide.factory('myHttpInterceptor', function($q, $location, notificationService) {
        return {
            'responseError': function(rejection) {
                console.log(rejection);
                if (rejection.status === 401 && $location.$$path !== '/login') {
                    $location.url('/login?to=' + encodeURIComponent($location.$$url));

                    rejection.data = {
                        message: 'You need to log in first'
                    };
                } else if (rejection.data.message) {
                    notificationService.handleError(rejection.data.message);
                }

                return $q.reject(rejection);
            }
        };
    });

    $httpProvider.interceptors.push('myHttpInterceptor');
});

app.config(function($stateProvider,
    $urlRouterProvider,
    $locationProvider,
    cfpLoadingBarProvider) {

    cfpLoadingBarProvider.includeSpinner = true;

    // enable xhr

    $urlRouterProvider.otherwise('/');

    $stateProvider
        .state('home', {
            url: '/',
            templateUrl: 'partials/landing.html',
            controller: 'LandingCtrl'
        });

    $stateProvider
        .state('signup', {
            url: '/signup',
            templateUrl: 'partials/signup.html',
            controller: 'SignupCtrl'
        });

    $stateProvider
        .state('login', {
            url: '/login?to',
            templateUrl: 'partials/login.html',
            controller: 'LoginCtrl'
        });

    $stateProvider
        .state('activate', {
            url: '/activate?email&token&resetrequired',
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

    // TODO: rename all html ad references to post like this:

    $stateProvider
        .state('viewAdvertisementPublic', {
            url: '/organization/{orgId}/post/{adId}/public?from',
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

    // token will only be there if the change password request comes through
    // a request to password reset
    $stateProvider
        .state('changePassword', {
            url: '/me/changepassword?token',
            templateUrl: 'partials/change_password.html',
            controller: 'ChangePasswordCtrl'
        });

    $stateProvider
        .state('resetPassword', {
            url: '/resetpassword',
            templateUrl: 'partials/reset_password.html',
            controller: 'ResetPasswordCtrl'
        });

    $stateProvider
        .state('editOrganization', {
            url: '/organization/edit',
            templateUrl: 'partials/organization_create.html',
            controller: 'EditOrgCtrl'
        });

    $stateProvider
        .state('viewOrganization', {
            url: '/organization/:orgId/view',
            templateUrl: 'partials/organization_view.html',
            controller: 'ViewOrgProfileCtrl'
        });

});

app.run(function($rootScope, userService, subwayService, notificationService) {
    $rootScope.$on('restorestate', userService.restoreState);

    $rootScope.$on('refreshNotifications', function() {
        if (!userService.isLoggedIn())
            return;

        subwayService.getAllNotifications().success(function(data) {
            $rootScope.notifications = data.notifications;
        }).error(function(err) {
            notificationService.handleError(err.message);
        });
    });

    $rootScope.$broadcast('restorestate');
    $rootScope.$broadcast('refreshNotifications');
});