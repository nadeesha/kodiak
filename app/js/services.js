/* jshint indent: false */

'use strict';

var services = angular.module('kodiak.services', []);

services.factory('userService', ['$rootScope', '$localStorage', '$http', 'GRIZZLY_URL',
    function($rootScope, $localStorage, $http, GRIZZLY_URL) {
        var setUserType = function() {
            var isOrgUser = !! $rootScope.u.affiliation;
            var tokenExpiration = $rootScope.u.expiration;
            var stateRestored = $rootScope.u.restored;

            if (stateRestored && isOrgUser && moment().isBefore(tokenExpiration)) {
                $rootScope.u.type = 'ORG';
            } else if (stateRestored && !isOrgUser &&
                tokenExpiration && moment().isBefore(tokenExpiration)) {
                $rootScope.u.type = 'PERSONAL';
            } else {
                $rootScope.u.type = 'NEW';
            }
        };

        var service = {
            saveState: function() {
                $localStorage.user = angular.toJson($rootScope.u);
            },
            restoreState: function() {
                if (!$rootScope.u) {
                    $rootScope.u = {};
                }

                if (!$rootScope.u.restored && $localStorage.user) {
                    $rootScope.u = angular.fromJson($localStorage.user);
                    $rootScope.u.restored = true;
                }

                setUserType();
            },
            create: function(user) {
                return $http.put(GRIZZLY_URL + '/user', JSON.stringify(user));
            },
            createOrgUser: function(user) {
                return $http.put(GRIZZLY_URL + '/organization/user', JSON.stringify(user));
            },
            login: function(user, callback) {
                $http.put(GRIZZLY_URL + '/user/token', JSON.stringify(user))
                    .success(function(data) {
                        $rootScope.u = {
                            _id: data._id,
                            firstName: data.firstName,
                            lastName: data.lastName,
                            email: user.email,
                            access_token: data.access_token,
                            expiration: data.expiration,
                            affiliation: data.affiliation,
                            restored: true,
                            type: null // ORG, NEW or PERSONAL
                        };

                        service.saveState();
                        setUserType();

                        $rootScope.$broadcast('loggedIn', !! data.affiliation);

                        callback(null, data);
                    }).error(function(data, status) {
                        callback(status, data);
                    });
            },
            isLoggedIn: function() {
                if ($rootScope.u.access_token && moment($rootScope.u.expiration).isAfter(moment())) {
                    return true;
                } else {
                    return false;
                }
            },
            activate: function(user) {
                return $http.post(GRIZZLY_URL + '/user/activate', JSON.stringify(user));
            },
            getProfile: function(id) {
                if (!id) {
                    id = 'me';
                }

                return $http.get(GRIZZLY_URL + '/user/' + id + '/profile');
            },
            getProfileStats: function() {
                return $http.get(GRIZZLY_URL + '/user/me/profile/stats');
            },
            saveProfile: function(profile) {
                var user = {
                    profile: profile
                };

                return $http.post(GRIZZLY_URL + '/user/me/profile',
                    JSON.stringify(user));
            },
            getResponses: function() {
                return $http.get(GRIZZLY_URL + '/user/me/applications');
            },
            logout: function() {
                $rootScope.u = {
                    type: 'NEW'
                };

                $rootScope.$broadcast('loggedOut');

                service.saveState();
            },
            requestPasswordReset: function(email) {
                return $http.put(GRIZZLY_URL + '/user/account/password/token',
                    JSON.stringify({
                        email: email
                    })
                );
            },
            changePassword: function(password, resetcode) {
                if (!service.isLoggedIn()) {
                    return $http.post(GRIZZLY_URL + '/user/account/password',
                        JSON.stringify({
                            token: resetcode,
                            password: password
                        })
                    );
                } else {
                    return $http.post(GRIZZLY_URL +
                        '/user/' + $rootScope.u._id + '/account/password',
                        JSON.stringify({
                            password: password
                        })
                    );
                }
            },
            uploadCv: function(files) {
                var formData = new FormData();
                for (var i in files) {
                    formData.append('file_' + i, files[i]);
                }

                return $http({
                    method: 'PUT',
                    url: GRIZZLY_URL + '/organization/' + id + '/logo',
                    data: formData,
                    headers: {
                        'Content-Type': 'undefined'
                    },
                    transformRequest: angular.identity
                });
            },
        };

        return service;
    }
]);

services.factory('orgService', ['$http', 'GRIZZLY_URL', 'userService', '$rootScope',
    function($http, GRIZZLY_URL) {
        var service = {
            createOrg: function(org, callback) {
                return $http.put(GRIZZLY_URL + '/organization', JSON.stringify(org))
            },
            editOrg: function(id, org) {
                return $http.post(GRIZZLY_URL + '/organization/' + id, JSON.stringify(org));
            },
            getOrg: function(id) {
                return $http.get(GRIZZLY_URL + '/organization/' + id + '/public');
            },
            getAds: function(id) {
                return $http.get(GRIZZLY_URL + '/organization/' + id + '/posts');
            },
            uploadLogo: function(id, files) {
                var formData = new FormData();
                for (var i in files) {
                    formData.append('file_' + i, files[i]);
                }

                return $http({
                    method: 'PUT',
                    url: GRIZZLY_URL + '/organization/' + id + '/logo',
                    data: formData,
                    headers: {
                        'Content-Type': 'undefined'
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
                return $http.put(GRIZZLY_URL + '/organization/' + orgId + '/post/', JSON.stringify(ad));
            },
            editAd: function(orgId, id, ad) {
                return $http.post(GRIZZLY_URL + '/organization/' + orgId + '/post/' + id,
                    JSON.stringify(ad));
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
                    JSON.stringify(search));
            },
            editSearch: function(orgId, id, search) {
                return $http.post(GRIZZLY_URL + '/organization/' + orgId + '/search/' + id,
                    JSON.stringify(search));
            },
            getSearch: function(orgId, id) {
                return $http.get(GRIZZLY_URL + '/organization/' + orgId + '/search/' + id);
            },
            getSearchForAd: function(orgId, adId) {
                return $http.get(GRIZZLY_URL + '/organization/' + orgId + '/post/' + adId + '/search');
            },
            getSearchResults: function(orgId, id) {
                return $http.get(GRIZZLY_URL + '/organization/' + orgId + '/search/' + id + '/results');
            }
        };

        return service;
    }
]);

services.factory('adResponseService', ['$http', 'GRIZZLY_URL', 'userService',
    function($http, GRIZZLY_URL) {
        var service = {
            createResponse: function(userId, orgId, adId, tags) {
                var o = {
                    user: userId,
                    tags: tags
                };

                return $http.put(GRIZZLY_URL + '/organization/' + orgId + '/post/' + adId + '/response',
                    JSON.stringify(o));
            },
            editResponse: function(orgId, adId, responseId, status, tags) {
                var o = {
                    status: status,
                    tags: tags
                };

                return $http.post(GRIZZLY_URL + '/organization/' + orgId + '/post/' + adId + '/response/' +
                    responseId, JSON.stringify(o));
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

                return $http.post(GRIZZLY_URL + '/user/notifications/' + id, JSON.stringify(o));
            },
            markAsUnread: function(id) {
                var o = {
                    isRead: false
                };

                return $http.post(GRIZZLY_URL + '/user/notifications/' + id, JSON.stringify(o));
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

services.factory('utilService', [

    function() {
        return {
            getTimes: function(n) {
                if (!n) {
                    return;
                }

                return new Array(Number(n));
            }
        };
    }
]);