angular.module('kodiak').service('userService', function($rootScope, $localStorage, $http,
    GRIZZLY_URL) {
    'use strict';

    var that = this;

    var setUserType = function() {
        var isOrgUser = !!$rootScope.u.affiliation;
        var tokenExpiration = $rootScope.u.sessionExpiredAt;
        var stateRestored = $rootScope.u.restored;

        if (stateRestored && isOrgUser) {
            $rootScope.u.type = 'ORG';
        } else if (stateRestored && !isOrgUser && tokenExpiration) {
            $rootScope.u.type = 'PERSONAL';

            that.getResponses().success(function (data) {
                $rootScope.u.invitationCount = _.where(data.responses, function (response) {
                    return response.status === 'applied';
                }).length;
            });
        } else {
            $rootScope.u.type = 'NEW';
        }

        if (window.trackJs) {
            window.trackJs.configure({
                userId: $rootScope.u.email
            });
        }
    };

    var saveState = function() {
        $localStorage.user = angular.toJson($rootScope.u);
    };

    var restoreState = function() {
        if (!$rootScope.u) {
            $rootScope.u = {};
        }

        if (!$rootScope.u.restored && $localStorage.user) {
            $rootScope.u = angular.fromJson($localStorage.user);
            $rootScope.u.restored = true;
        }

        setUserType();
    };

    this.create = function(user) {
        return $http.put(GRIZZLY_URL + '/user', angular.toJson(user));
    };

    this.createViaFacebook = function(user) {
        return $http.put(GRIZZLY_URL + '/user/facebook', angular.toJson(user));
    };

    this.createOrgUser = function(user) {
        return $http.put(GRIZZLY_URL + '/organization/user', angular.toJson(user));
    };

    this.login = function(user, authType, callback) {
        var url = '/user/token';

        if (!callback && typeof authType === 'function') {
            callback = authType;
            authType = null;
        } else {
            url = url + '/' + authType;
        }

        $http.put(GRIZZLY_URL + url, angular.toJson(user)).success(function(data) {
            $rootScope.u = {
                _id: data._id,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                access_token: data.access_token,
                affiliation: data.affiliation,
                sessionExpiredAt: Date.now() + data.secondsRemaining * 1000,
                restored: true,
                type: null // ORG, NEW or PERSONAL
            };

            saveState();
            setUserType();

            $rootScope.$broadcast('loggedIn', !!data.affiliation);

            callback(null, data);
        }).error(function(data, status) {
            callback(status, data);
        });
    };

    this.isLoggedIn = function() {
        if ($rootScope.u.access_token && Date.now() < $rootScope.u.sessionExpiredAt) {
            return true;
        } else {
            return false;
        }
    };

    this.activate = function(user) {
        return $http.post(GRIZZLY_URL + '/user/activate', angular.toJson(user));
    };

    this.getProfile = function(id) {
        if (!id) {
            id = 'me';
        }

        return $http.get(GRIZZLY_URL + '/user/' + id + '/profile');
    };

    this.getLimitedProfile = function() {
        return $http.get(GRIZZLY_URL + '/user/me/profile?limited=true');
    };

    this.getProfileStats = function() {
        return $http.get(GRIZZLY_URL + '/user/me/profile/stats');
    };

    this.saveProfile = function(profile) {
        var user = {
            profile: profile
        };

        return $http.post(GRIZZLY_URL + '/user/me/profile',
            angular.toJson(user));
    };

    this.getResponses = function() {
        return $http.get(GRIZZLY_URL + '/user/me/applications');
    };

    this.logout = function() {
        $rootScope.u = {
            type: 'NEW'
        };

        $rootScope.$broadcast('loggedOut');

        saveState();
    };

    this.requestPasswordReset = function(email) {
        return $http.put(GRIZZLY_URL + '/user/account/password/token',
            angular.toJson({
                email: email
            })
        );
    };

    this.changePassword = function(password, resetcode) {
        if (!this.isLoggedIn()) {
            return $http.post(GRIZZLY_URL + '/user/account/password',
                angular.toJson({
                    token: resetcode,
                    password: password
                })
            );
        } else {
            return $http.post(GRIZZLY_URL +
                '/user/' + $rootScope.u._id + '/account/password',
                angular.toJson({
                    password: password
                })
            );
        }
    };

    this.getQualifications = function(query) {
        return $http.get(GRIZZLY_URL + '/user/meta/qualifications/' + query);
    };

    this.getQualificationFields = function(query) {
        return $http.get(GRIZZLY_URL + '/user/meta/fields/' + query);
    };

    // restore state upon construction
    restoreState();
});
