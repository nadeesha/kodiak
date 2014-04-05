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
    'chieffancypants.loadingBar',
    'ngGrid',
    'autocomplete'
]);

app.config(function($httpProvider, $provide) {
    $httpProvider.defaults.useXDomain = true;

    // register the interceptor as a service
    $provide.factory('errorHandler', function($q, $location, notificationService, $rootScope) {
        return {
            // optional method
            'responseError': function(rejection) {
                if (rejection.status === 401 && $location.$$path !== '/login') {
                    $location.url('/login?to=' + encodeURIComponent($location.$$url));

                    rejection.data = {
                        message: 'You need to log in first'
                    };
                } else if (rejection.data.message) {
                    notificationService.handleError(rejection.data.message);
                }

                return $q.reject(rejection);
            },

            'request': function(config) {
                if ($rootScope.u) {
                    config.headers.Authorization = 'Bearer ' + $rootScope.u.access_token;
                    return config;
                }
            }
        };
    });

    $httpProvider.interceptors.push('errorHandler');
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
            controller: 'LandingCtrl',
            data: {
                public: true
            }
        });

    $stateProvider
        .state('signup', {
            url: '/signup?token',
            templateUrl: 'partials/signup.html',
            controller: 'SignupCtrl',
            data: {
                public: true
            }
        });

    $stateProvider
        .state('login', {
            url: '/login?to',
            templateUrl: 'partials/login.html',
            controller: 'LoginCtrl',
            data: {
                public: true
            }
        });

    $stateProvider
        .state('activate', {
            url: '/activate?email&token&resetrequired',
            templateUrl: 'partials/activate.html',
            controller: 'ActivateCtrl',
            data: {
                public: true
            }
        });

    $stateProvider
        .state('myApplications', {
            url: '/me/applications',
            templateUrl: 'partials/dashboard_me.html',
            controller: 'MeDashboardCtrl',
            data: {
                public: false
            }
        });

    $stateProvider
        .state('jobBoard', {
            url: '/ads',
            templateUrl: 'partials/ads_public.html',
            controller: 'JobBoardCtrl',
            data: {
                public: false
            }
        });

    $stateProvider
        .state('editProfile', {
            url: '/me/edit',
            templateUrl: 'partials/me.html',
            controller: 'MeCtrl',
            data: {
                public: false
            }
        });

    $stateProvider
        .state('viewProfile', {
            url: '/me',
            templateUrl: 'partials/me.html',
            controller: 'MeCtrl',
            data: {
                public: false
            }
        });

    $stateProvider
        .state('viewProfilePrivate', {
            url: '/me/private',
            templateUrl: 'partials/private_me.html',
            controller: 'PrivateMeCtrl',
            data: {
                public: false
            }
        });

    $stateProvider
        .state('createOrganization', {
            url: '/organization/create',
            templateUrl: 'partials/organization_create.html',
            controller: 'CreateOrgCtrl',
            data: {
                public: false
            }
        });

    $stateProvider
        .state('organizationDashboard', {
            url: '/organization/dashboard',
            templateUrl: 'partials/dashboard_org.html',
            controller: 'ViewOrgCtrl',
            data: {
                public: false
            }
        });

    $stateProvider
        .state('campaignHome', {
            url: '/organization/campaign/:adId',
            templateUrl: 'partials/campaign_home.html',
            controller: 'ViewCampaignCtrl',
            data: {
                public: false
            }
        });

    $stateProvider
        .state('createAdvertisement', {
            url: '/organization/ad/create',
            templateUrl: 'partials/ad_create.html',
            controller: 'CreateAdCtrl',
            data: {
                public: false
            }
        });

    $stateProvider
        .state('viewAdvertisement', {
            url: '/organization/ad/{adId}/view',
            templateUrl: 'partials/ad_view.html',
            controller: 'ViewAdCtrl',
            data: {
                public: false
            }
        });

    // TODO: rename all html ad references to post like this:

    $stateProvider
        .state('viewAdvertisementPublic', {
            url: '/organization/{orgId}/post/{adId}/public?from',
            templateUrl: 'partials/post_view_public.html',
            controller: 'ViewPublicAdCtrl',
            data: {
                public: true
            }
        });

    $stateProvider
        .state('editAdvertisement', {
            url: '/organization/ad/{adId}/edit',
            templateUrl: 'partials/ad_create.html',
            controller: 'CreateAdCtrl',
            data: {
                public: false
            }
        });

    $stateProvider
        .state('createSearch', {
            url: '/organization/ad/{adId}/search/create',
            templateUrl: 'partials/search.html',
            controller: 'SearchCtrl',
            data: {
                public: false
            }
        });

    $stateProvider
        .state('viewSearch', {
            url: '/organization/ad/{adId}/search/{searchId}',
            templateUrl: 'partials/search.html',
            controller: 'SearchCtrl',
            data: {
                public: false
            }
        });

    $stateProvider
        .state('logout', {
            url: '/logout',
            templateUrl: 'partials/logout.html',
            controller: 'LogoutCtrl',
            data: {
                public: true
            }
        });

    // token will only be there if the change password request comes through
    // a request to password reset
    $stateProvider
        .state('changePassword', {
            url: '/me/changepassword?token',
            templateUrl: 'partials/change_password.html',
            controller: 'ChangePasswordCtrl',
            data: {
                public: true
            }
        });

    $stateProvider
        .state('resetPassword', {
            url: '/resetpassword',
            templateUrl: 'partials/reset_password.html',
            controller: 'ResetPasswordCtrl',
            data: {
                public: true
            }
        });

    $stateProvider
        .state('editOrganization', {
            url: '/organization/edit',
            templateUrl: 'partials/organization_create.html',
            controller: 'EditOrgCtrl',
            data: {
                public: false
            }
        });

    $stateProvider
        .state('viewOrganization', {
            url: '/organization/:orgId/view',
            templateUrl: 'partials/organization_view.html',
            controller: 'ViewOrgProfileCtrl',
            data: {
                public: true
            }
        });

    $stateProvider
        .state('termsOfService', {
            url: '/tos',
            templateUrl: 'partials/tos.html',
            data: {
                public: true
            }
        });

    $stateProvider
        .state('privacyPolicy', {
            url: '/pp',
            templateUrl: 'partials/pp.html',
            data: {
                public: true
            }
        });

    $stateProvider
        .state('contact', {
            url: '/contact',
            templateUrl: 'partials/contact.html',
            data: {
                public: true
            }
        });

    $stateProvider
        .state('admin', {
            url: '/admin',
            templateUrl: 'partials/admin.html',
            data: {
                public: false
            }
        });

    $stateProvider
        .state('adminUsers', {
            url: '/admin/users',
            templateUrl: 'partials/admin_users.html',
            controller: 'AdminUsersCtrl',
            data: {
                public: false
            }
        });

   $stateProvider
        .state('adminInvites', {
            url: '/admin/invites',
            templateUrl: 'partials/admin_invites.html',
            controller: 'AdminInvitesCtrl',
            data: {
                public: false
            }
        });
});

app.run(function($rootScope, userService, subwayService, notificationService, $state) {
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

    $rootScope.$on('$stateChangeStart', function(ev, toState, toParams, fromState) {
        // Check if this state is protected
        if ((!toState.data || (toState.data && toState.data.public === false)) && !userService.isLoggedIn()) {
            ev.preventDefault();
            $state.transitionTo('login');
        }
    });

    $rootScope.$broadcast('restorestate');
    $rootScope.$broadcast('refreshNotifications');
});