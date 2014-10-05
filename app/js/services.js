/* jshint indent: false */

'use strict';

var services = angular.module('kodiak.services', []);

angular.module('kodiak').service('userService', ['$rootScope', '$localStorage', '$http', 'GRIZZLY_URL',
    function($rootScope, $localStorage, $http, GRIZZLY_URL) {
        var setUserType = function() {
            var isOrgUser = !!$rootScope.u.affiliation;
            var tokenExpiration = $rootScope.u.sessionExpiredAt;
            var stateRestored = $rootScope.u.restored;

            if (stateRestored && isOrgUser) {
                $rootScope.u.type = 'ORG';
            } else if (stateRestored && !isOrgUser && tokenExpiration) {
                $rootScope.u.type = 'PERSONAL';
            } else {
                $rootScope.u.type = 'NEW';
            }

            if (window.trackJs) {
                window.trackJs.configure({
                    userId: $rootScope.u.email,
                    trackAjaxFail: false
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

        this.createOrgUser = function(user) {
            return $http.put(GRIZZLY_URL + '/organization/user', angular.toJson(user));
        };

        this.login = function(user, callback) {
            $http.put(GRIZZLY_URL + '/user/token', angular.toJson(user)).success(function(data) {

                $rootScope.u = {
                    _id: data._id,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: user.email,
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
    }
]);

services.factory('orgService', ['$http', 'GRIZZLY_URL', 'userService', '$rootScope',
    function($http, GRIZZLY_URL) {
        var service = {
            makeRequest: function (request) {
                return $http.post(GRIZZLY_URL + '/organization/requests', angular.toJson(request));
            },
            getRequests: function () {
                return $http.get(GRIZZLY_URL + '/organization/requests');
            },
            createOrg: function(org) {
                return $http.put(GRIZZLY_URL + '/organization', angular.toJson(org));
            },
            editOrg: function(id, org) {
                return $http.post(GRIZZLY_URL + '/organization/' + id, angular.toJson(org));
            },
            getOrg: function(id) {
                return $http.get(GRIZZLY_URL + '/organization/' + id + '/public');
            },
            getAds: function(id) {
                return $http.get(GRIZZLY_URL + '/organization/' + id + '/posts');
            },
            getPublicAds: function(id) {
                return $http.get(GRIZZLY_URL + '/organization/' + id + '/public/posts');
            },
            uploadLogo: function(id, files) {
                var formData = new FormData();
                for (var i in files) {
                    if (files.hasOwnProperty(i)) {
                        formData.append('file_' + i, files[i]);
                    }
                }

                return $http({
                    method: 'PUT',
                    url: GRIZZLY_URL + '/organization/' + id + '/logo',
                    data: formData,
                    headers: {
                        'Content-Type': undefined
                    },
                    transformRequest: angular.identity
                });
            },
            getUsers: function(id) {
                return $http.get(GRIZZLY_URL + '/organization/' + id + '/users');
            },
            deactivateUser: function(orgId, userId) {
                return $http.delete(GRIZZLY_URL + '/organization/' + orgId + '/user/' + userId);
            }
        };

        return service;
    }
]);

services.factory('adService', ['$http', 'GRIZZLY_URL', 'userService',
    function($http, GRIZZLY_URL) {
        var service = {
            createAd: function(orgId, ad) {
                return $http.put(GRIZZLY_URL + '/organization/' + orgId + '/post/', angular.toJson(ad));
            },
            editAd: function(orgId, id, ad) {
                return $http.post(GRIZZLY_URL + '/organization/' + orgId + '/post/' + id,
                    angular.toJson(ad));
            },
            getAd: function(orgId, id) {
                return $http.get(GRIZZLY_URL + '/organization/' + orgId + '/post/' + id);
            },
            getAdPublic: function(orgId, id) {
                return $http.get(GRIZZLY_URL + '/organization/' + orgId + '/public/post/' + id);
            },
            getAdsPublic: function() {
                return $http.get(GRIZZLY_URL + '/ads/public');
            },
            deleteAd: function(orgId, id) {
                return $http.delete(GRIZZLY_URL + '/organization/' + orgId + '/post/' + id);
            }
        };

        return service;
    }
]);

services.factory('searchService', ['$http', 'GRIZZLY_URL', 'userService',
    function($http, GRIZZLY_URL) {
        var service = {
            createSearch: function(orgId, search) {
                return $http.put(GRIZZLY_URL + '/organization/' + orgId + '/search/',
                    angular.toJson(search));
            },
            editSearch: function(orgId, id, search) {
                return $http.post(GRIZZLY_URL + '/organization/' + orgId + '/search/' + id,
                    angular.toJson(search));
            },
            getSearch: function(orgId, id) {
                return $http.get(GRIZZLY_URL + '/organization/' + orgId + '/search/' + id);
            },
            getSearchForAd: function(orgId, adId) {
                return $http.get(GRIZZLY_URL + '/organization/' + orgId + '/post/' + adId + '/search');
            },
            getSearchResults: function(orgId, id) {
                return $http.get(GRIZZLY_URL + '/organization/' + orgId + '/search/' + id + '/results');
            },
            hitUser: function (orgId, searchId, user) {
                return $http.post(GRIZZLY_URL + '/organization/' + orgId + '/search/' + searchId + '/hit',
                    angular.toJson(user));
            }
        };

        return service;
    }
]);

services.factory('adResponseService', ['$http', 'GRIZZLY_URL', 'userService',
    function($http, GRIZZLY_URL) {
        var service = {
            createResponse: function(userId, orgId, adId, tags, referredBy) {
                return $http.put(GRIZZLY_URL + '/organization/' + orgId + '/post/' + adId + '/response',
                    angular.toJson({
                        user: userId,
                        tags: tags,
                        referredBy: referredBy === userId ? null : referredBy
                    }));
            },
            editResponse: function(orgId, adId, responseId, status, tags) {
                var o = {
                    status: status,
                    tags: tags
                };

                return $http.post(GRIZZLY_URL + '/organization/' + orgId + '/post/' + adId + '/response/' +
                    responseId, angular.toJson(o));
            },
            getResponse: function(orgId, adId, responseId) {
                return $http.get(GRIZZLY_URL + '/organization/' + orgId + '/post/' + adId + '/response/' +
                    responseId);
            },
            getAllResponses: function(orgId, adId) {
                return $http.get(GRIZZLY_URL + '/organization/' + orgId + '/post/' + adId + '/responses');
            }
        };

        return service;
    }
]);

services.factory('subwayService', ['$http', 'GRIZZLY_URL', 'userService',
    function($http, GRIZZLY_URL) {
        var service = {
            getAllNotifications: function() {
                return $http.get(GRIZZLY_URL + '/user/notifications');
            },
            markAsRead: function(id) {
                var o = {
                    isRead: true
                };

                return $http.post(GRIZZLY_URL + '/user/notifications/' + id, angular.toJson(o));
            },
            markAsUnread: function(id) {
                var o = {
                    isRead: false
                };

                return $http.post(GRIZZLY_URL + '/user/notifications/' + id, angular.toJson(o));
            }
        };

        return service;
    }
]);

services.factory('notificationService', [

    function() {
        return {
            notify: function(hash) {
                $.pnotify(hash);
            },
            handleError: function(msg, title) {
                this.notify({
                    title: title || 'Something went wrong!',
                    text: msg || 'Unknown Error',
                    type: 'error',
                    hide: true
                });
            },
            handleSuccess: function(msg, title) {
                this.notify({
                    title: title || 'Success!',
                    text: msg || 'Everything went ok.',
                    type: 'success',
                    hide: true
                });
            },
            handleInfo: function(msg, title) {
                this.notify({
                    title: title || 'Oh!',
                    text: msg || 'That\'s a no no, my friend!',
                    type: 'info',
                    hide: true
                });
            },
            handleWarning: function(msg, title) {
                this.notify({
                    title: title || 'Warning!',
                    text: msg || 'That might cause problems, my friend!',
                    type: 'warning',
                    hide: true
                });
            }
        };
    }
]);

services.factory('validationService', ['notificationService',
    function(notificationService) {
        return {
            mustBeTrue: function(expression, msg) {
                if (!expression) {
                    notificationService.notify({
                        title: 'Ooops!',
                        text: msg,
                        type: 'info',
                        hide: true
                    });

                    throw msg;
                }
            }
        };
    }
]);

services.factory('adminService', function($http, GRIZZLY_URL) {
    return {
        getAllUsers: function() {
            return $http.get(GRIZZLY_URL + '/admin/users');
        },

        updateUsers: function() {
            return $http.put(GRIZZLY_URL + '/admin/updateusers');
        },

        indexUsers: function () {
            return $http.put(GRIZZLY_URL + '/admin/indexusers');
        }
    };
});

services.factory('utilService', function(GRIZZLY_URL, $http) {
    return {
        getTimes: function(n) {
            if (!n) {
                return [];
            }

            var times;

            times = Math.floor(Number(n));

            if (isNaN(times)) {
                return [];
            } else {
                return new Array(times);
            }
        },
        shortenUrl: function(url) {
            return $http.put(GRIZZLY_URL + '/common/shortenurl', angular.toJson({
                url: url
            }));
        }
    };
});