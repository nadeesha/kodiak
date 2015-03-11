/* jshint indent: false */

'use strict';

var services = angular.module('kodiak.services', []);

services.factory('orgService', ['$http', 'GRIZZLY_URL', 'userService', '$rootScope',
    function ($http, GRIZZLY_URL) {
        var service = {
            makeRequest: function (request) {
                return $http.post(GRIZZLY_URL + '/organization/requests', angular.toJson(request));
            },
            getRequests: function () {
                return $http.get(GRIZZLY_URL + '/organization/requests');
            },
            createOrg: function (org) {
                return $http.put(GRIZZLY_URL + '/organization', angular.toJson(org));
            },
            editOrg: function (id, org) {
                return $http.post(GRIZZLY_URL + '/organization/' + id, angular.toJson(org));
            },
            getOrg: function (id) {
                return $http.get(GRIZZLY_URL + '/organization/' + id + '/public');
            },
            getAds: function (id) {
                return $http.get(GRIZZLY_URL + '/organization/' + id + '/posts');
            },
            getPublicAds: function (id) {
                return $http.get(GRIZZLY_URL + '/organization/' + id + '/public/posts');
            },
            uploadLogo: function (id, files) {
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
            getUsers: function (id) {
                return $http.get(GRIZZLY_URL + '/organization/' + id + '/users');
            },
            deactivateUser: function (orgId, userId) {
                return $http.delete(GRIZZLY_URL + '/organization/' + orgId + '/user/' + userId);
            },
            getAllOrgs: function () {
                return $http.get(GRIZZLY_URL + '/organizations');
            }
        };

        return service;
    }
]);

services.factory('adService', ['$http', 'GRIZZLY_URL', 'userService',
    function ($http, GRIZZLY_URL) {
        var service = {
            createAd: function (orgId, ad) {
                return $http.put(GRIZZLY_URL + '/organization/' + orgId + '/post/', angular.toJson(ad));
            },
            editAd: function (orgId, id, ad) {
                return $http.post(GRIZZLY_URL + '/organization/' + orgId + '/post/' + id,
                    angular.toJson(ad));
            },
            getAd: function (orgId, id) {
                return $http.get(GRIZZLY_URL + '/organization/' + orgId + '/post/' + id);
            },
            getAdPublic: function (orgId, id) {
                return $http.get(GRIZZLY_URL + '/organization/' + orgId + '/public/post/' + id);
            },
            getAdsPublic: function () {
                return $http.get(GRIZZLY_URL + '/ads/public');
            },
            deleteAd: function (orgId, id) {
                return $http.delete(GRIZZLY_URL + '/organization/' + orgId + '/post/' + id);
            }
        };

        return service;
    }
]);

services.factory('searchService', ['$http', 'GRIZZLY_URL', 'userService',
    function ($http, GRIZZLY_URL) {
        var service = {
            createSearch: function (orgId, search) {
                return $http.put(GRIZZLY_URL + '/organization/' + orgId + '/search/',
                    angular.toJson(search));
            },
            editSearch: function (orgId, id, search) {
                return $http.post(GRIZZLY_URL + '/organization/' + orgId + '/search/' + id,
                    angular.toJson(search));
            },
            getSearch: function (orgId, id) {
                return $http.get(GRIZZLY_URL + '/organization/' + orgId + '/search/' + id);
            },
            getSearchForAd: function (orgId, adId) {
                return $http.get(GRIZZLY_URL + '/organization/' + orgId + '/post/' + adId + '/search');
            },
            getSearchResults: function (orgId, id) {
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
    function ($http, GRIZZLY_URL) {
        var service = {
            createResponse: function (userId, orgId, adId, tags, referredBy, answers) {
                return $http.put(GRIZZLY_URL + '/organization/' + orgId + '/post/' + adId + '/response',
                    angular.toJson({
                        user: userId,
                        tags: tags,
                        referredBy: referredBy,
                        answers: answers
                    }));
            },
            editResponse: function (orgId, adId, responseId, status, tags) {
                var o = {
                    status: status,
                    tags: tags
                };

                return $http.post(GRIZZLY_URL + '/organization/' + orgId + '/post/' + adId + '/response/' +
                    responseId, angular.toJson(o));
            },
            getResponse: function (orgId, adId, responseId) {
                return $http.get(GRIZZLY_URL + '/organization/' + orgId + '/post/' + adId + '/response/' +
                    responseId);
            },
            getAllResponses: function (orgId, adId) {
                return $http.get(GRIZZLY_URL + '/organization/' + orgId + '/post/' + adId + '/responses');
            }
        };

        return service;
    }
]);

services.factory('subwayService', ['$http', 'GRIZZLY_URL', 'userService',
    function ($http, GRIZZLY_URL) {
        var service = {
            getAllNotifications: function () {
                return $http.get(GRIZZLY_URL + '/user/notifications');
            },
            markAsRead: function (id) {
                var o = {
                    isRead: true
                };

                return $http.post(GRIZZLY_URL + '/user/notifications/' + id, angular.toJson(o));
            },
            markAsUnread: function (id) {
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

    function () {
        return {
            notify: function (hash) {
                $.pnotify(hash);
            },
            handleError: function (msg, title) {
                this.notify({
                    title: title || 'Something went wrong!',
                    text: msg || 'Unknown Error',
                    type: 'error',
                    hide: true
                });
            },
            handleSuccess: function (msg, title) {
                this.notify({
                    title: title || 'Success!',
                    text: msg || 'Everything went ok.',
                    type: 'success',
                    hide: true
                });
            },
            handleInfo: function (msg, title) {
                this.notify({
                    title: title || 'Oh!',
                    text: msg || 'That\'s a no no, my friend!',
                    type: 'info',
                    hide: true
                });
            },
            handleWarning: function (msg, title) {
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
    function (notificationService) {
        return {
            mustBeTrue: function (expression, msg) {
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

services.factory('adminService', function ($http, GRIZZLY_URL) {
    return {
        getAllUsers: function () {
            return $http.get(GRIZZLY_URL + '/admin/users');
        },

        updateUsers: function () {
            return $http.put(GRIZZLY_URL + '/admin/updateusers');
        },

        indexUsers: function () {
            return $http.put(GRIZZLY_URL + '/admin/indexusers');
        }
    };
});

services.factory('utilService', function (GRIZZLY_URL, $http) {
    return {
        getTimes: function (n) {
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
        shortenUrl: function (url) {
            return $http.put(GRIZZLY_URL + '/common/shortenurl', angular.toJson({
                url: url
            }));
        }
    };
});
