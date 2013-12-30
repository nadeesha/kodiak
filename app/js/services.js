'use strict';

var services = angular.module('kodiak.services', []);

services.factory('userService', ['$rootScope', '$localStorage', '$http', 'GRIZZLY_URL',
    function($rootScope, $localStorage, $http, GRIZZLY_URL) {
        var setUserType = function() {
            if ($rootScope.u.restored && $rootScope.u.affiliation && moment().isBefore($rootScope.u.expiration))
                $rootScope.u.type = 'ORG';
            else if ($rootScope.u.restored && !$rootScope.u.affiliation && $rootScope.u.expiration && moment().isBefore($rootScope.u.expiration))
                $rootScope.u.type = 'PERSONAL';
            else
                $rootScope.u.type = 'NEW';
        };

        var service = {
            authHeader: function() {
                service.restoreState();

                var config = {
                    headers: {
                        Authorization: 'Bearer ' + $rootScope.u.access_token
                    }
                };

                return config;
            },

            // TODO : deprecate
            user: function() {
                return _.pick($rootScope.u, 'firstName', 'lastName', 'email', 'affiliation');
            },


            saveState: function() {
                $localStorage.user = angular.toJson($rootScope.u);
            },

            restoreState: function() {
                if (!$rootScope.u)
                    $rootScope.u = {};

                if (!$rootScope.u.restored && $localStorage.user) {
                    $rootScope.u = angular.fromJson($localStorage.user);
                    $rootScope.u.restored = true;
                }

                setUserType();
            },

            create: function(user, callback) {
                $http.put(GRIZZLY_URL + '/user', JSON.stringify(user))
                    .success(function() {
                        // $rootScope.u.firstName = user.firstName;
                        // $rootScope.u.lastName = user.lastName;
                        // $rootScope.u.email = user.email;
                        // service.saveState();

                        callback();
                    }).error(function(data, status) {
                        // TODO: this can be converted to the new way of doing things.
                        callback(status, data);
                    });
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
                            type: null // ORG, NEW or PERSONAL
                        };

                        service.saveState();
                        setUserType();

                        callback(null, data);
                    }).error(function(data, status) {
                        callback(status, data);
                    });
            },

            activate: function(user, callback) {
                var o = {
                    email: encodeURIComponent(user.email),
                    token: encodeURIComponent(user.token)
                };

                $http.post(GRIZZLY_URL + '/user/activate', JSON.stringify(o))
                    .success(function() {
                        callback();
                    }).error(function(data, status) {
                        callback(status, data);
                    });
            },

            getProfile: function(id, callback) {
                if (!callback && typeof id === 'function') {
                    callback = id;
                    id = 'me';
                }

                $http.get(GRIZZLY_URL + '/user/' + id + '/profile', service.authHeader())
                    .success(function(data) {
                        callback(null, data);
                    }).error(function(data) {
                        callback(data, null);
                    });
            },

            getProfileStats: function(callback) {
                $http.get(GRIZZLY_URL + '/user/me/profile/stats', service.authHeader())
                    .success(function(data) {
                        callback(null, data);
                    }).error(function(data) {
                        callback(data, null);
                    });
            },

            saveProfile: function(profile, callback) {
                var user = {
                    profile: profile
                };

                $http.post(GRIZZLY_URL + '/user/me/profile', JSON.stringify(user), service.authHeader())
                    .success(function() {
                        callback();
                    }).error(function(data) {
                        callback(data);
                    });
            },

            getResponses: function(callback) {
                $http.get(GRIZZLY_URL + '/user/me/applications', service.authHeader())
                    .success(function(data) {
                        callback(null, data);
                    }).error(function(data) {
                        callback(data);
                    });
            },

            logout: function() {
                $rootScope.u = {
                    type: 'NEW'
                };

                service.saveState();
            }
        };

        return service;
    }
]);

services.factory('orgService', ['$http', 'GRIZZLY_URL', 'userService',
    function($http, GRIZZLY_URL, userService) {
        var service = {
            createOrg: function(org, callback) {
                $http.put(GRIZZLY_URL + '/organization', JSON.stringify(org), userService.authHeader())
                    .success(function(data) {
                        callback(null, data);
                    })
                    .error(function(data) {
                        callback(data, null);
                    });
            },
            editOrg: function(id, org, callback) {
                $http.post(GRIZZLY_URL + '/organization/' + id, JSON.stringify(org), userService.authHeader())
                    .success(function() {
                        callback();
                    }).error(function(data) {
                        callback(data);
                    });
            },
            getOrg: function(id, callback) {
                $http.get(GRIZZLY_URL + '/organization/' + id + '/public')
                    .success(function(data) {
                        callback(null, data);
                    }).error(function(data) {
                        callback(data);
                    });
            },
            getAdsPublic: function(id, callback) {
                $http.get(GRIZZLY_URL + '/organization/' + id + '/public/posts')
                    .success(function(data) {
                        callback(null, data);
                    }).error(function(data) {
                        callback(data);
                    });
            },
            getAds: function(id, callback) {
                $http.get(GRIZZLY_URL + '/organization/' + id + '/posts', userService.authHeader())
                    .success(function(data) {
                        callback(null, data);
                    }).error(function(data) {
                        callback(data);
                    });
            },
            getSearches: function(id, callback) {
                $http.get(GRIZZLY_URL + '/organization/' + id + '/searches', userService.authHeader())
                    .success(function(data) {
                        callback(null, data);
                    }).error(function(data) {
                        callback(data);
                    });
            }
        };

        return service;
    }
]);

services.factory('adService', ['$http', 'GRIZZLY_URL', 'userService',
    function($http, GRIZZLY_URL, userService) {
        var service = {
            createAd: function(orgId, ad, callback) {
                $http.put(GRIZZLY_URL + '/organization/' + orgId + '/post/', JSON.stringify(ad), userService.authHeader())
                    .success(function(data) {
                        callback(null, data);
                    })
                    .error(function(data) {
                        callback(data, null);
                    });
            },
            editAd: function(orgId, id, ad, callback) {
                $http.post(GRIZZLY_URL + '/organization/' + orgId + '/post/' + id, JSON.stringify(ad), userService.authHeader())
                    .success(function() {
                        callback();
                    }).error(function(data) {
                        callback(data);
                    });
            },
            getAd: function(orgId, id, callback) {
                $http.get(GRIZZLY_URL + '/organization/' + orgId + '/post/' + id, userService.authHeader())
                    .success(function(data) {
                        callback(null, data);
                    }).error(function(data) {
                        callback(data);
                    });
            },
            getAdPublic: function(orgId, id, callback) {
                $http.get(GRIZZLY_URL + '/organization/' + orgId + '/public/post/' + id)
                    .success(function(data) {
                        callback(null, data);
                    }).error(function(data) {
                        callback(data);
                    });
            },
            getAdsPublic: function(callback) {
                $http.get(GRIZZLY_URL + '/ads/public')
                    .success(function(data) {
                        callback(null, data);
                    }).error(function(data) {
                        callback(data);
                    });
            },
            deleteAd: function(orgId, id, callback) {
                $http.delete(GRIZZLY_URL + '/organization/' + orgId + '/post/' + id, userService.authHeader())
                    .success(function() {
                        callback();
                    }).error(function(data) {
                        callback(data);
                    });
            }
        };

        return service;
    }
]);

services.factory('searchService', ['$http', 'GRIZZLY_URL', 'userService',
    function($http, GRIZZLY_URL, userService) {
        var service = {
            createSearch: function(orgId, search, callback) {
                $http.put(GRIZZLY_URL + '/organization/' + orgId + '/search/', JSON.stringify(search), userService.authHeader())
                    .success(function(data) {
                        callback(null, data);
                    }).error(function(data) {
                        callback(data);
                    });
            },
            editSearch: function(orgId, id, search, callback) {
                $http.post(GRIZZLY_URL + '/organization/' + orgId + '/search/' + id, JSON.stringify(search), userService.authHeader())
                    .success(function() {
                        callback();
                    }).error(function(data) {
                        callback(data);
                    });
            },
            deleteSearch: function(orgId, id, callback) {
                $http.delete(GRIZZLY_URL + '/organization/' + orgId + '/search/' + id, userService.authHeader())
                    .success(function() {
                        callback();
                    }).error(function(data) {
                        callback(data);
                    });
            },
            getSearch: function(orgId, id, callback) {
                $http.get(GRIZZLY_URL + '/organization/' + orgId + '/search/' + id, userService.authHeader())
                    .success(function(data) {
                        callback(null, data);
                    }).error(function(data) {
                        callback(data);
                    });
            },
            getSearchForAd: function(orgId, adId, callback) {
                $http.get(GRIZZLY_URL + '/organization/' + orgId + '/post/' + adId + '/search', userService.authHeader())
                    .success(function(data) {
                        callback(null, data);
                    }).error(function(data) {
                        callback(data);
                    });
            },
            getSearchResults: function(orgId, id, callback) {
                $http.get(GRIZZLY_URL + '/organization/' + orgId + '/search/' + id + '/results', userService.authHeader())
                    .success(function(data) {
                        callback(null, data);
                    }).error(function(data) {
                        callback(data);
                    });
            },
            hitUser: function(orgId, id, userId, callback) {
                var o = {
                    user: {
                        id: userId
                    }
                };

                $http.post(GRIZZLY_URL + '/organization/' + orgId + '/search/' + id + '/hit', JSON.stringify(o), userService.authHeader())
                    .success(function() {
                        callback();
                    }).error(function(data) {
                        callback(data);
                    });
            },
            inviteUser: function(orgId, id, userId, callback) {
                var o = {
                    user: {
                        id: userId
                    }
                };

                $http.post(GRIZZLY_URL + '/organization/' + orgId + '/search/' + id + '/invite', JSON.stringify(o), userService.authHeader())
                    .success(function() {
                        callback();
                    }).error(function(data) {
                        callback(data);
                    });
            }
        };

        return service;
    }
]);

services.factory('adResponseService', ['$http', 'GRIZZLY_URL', 'userService',
    function($http, GRIZZLY_URL, userService) {
        var service = {
            createResponse: function(userId, orgId, adId, tags, callback) {
                var o = {
                    user: userId,
                    tags: tags
                };

                $http.put(GRIZZLY_URL + '/organization/' + orgId + '/post/' + adId + '/response', JSON.stringify(o), userService.authHeader())
                    .success(function(data) {
                        callback(null, data);
                    }).error(function(data) {
                        callback(data);
                    });
            },
            editResponse: function(orgId, adId, responseId, status, tags, callback) {
                var o = {
                    status: status,
                    tags: tags
                };

                $http.post(GRIZZLY_URL + '/organization/' + orgId + '/post/' + adId + '/response/' + responseId, JSON.stringify(o), userService.authHeader())
                    .success(function(data) {
                        callback(null, data);
                    }).error(function(data) {
                        callback(data);
                    });
            },
            getResponse: function(orgId, adId, responseId, callback) {
                $http.get(GRIZZLY_URL + '/organization/' + orgId + '/post/' + adId + '/response/' + responseId, userService.authHeader())
                    .success(function(data) {
                        callback(null, data);
                    }).error(function(data) {
                        callback(data);
                    });
            },
            getAllResponses: function(orgId, adId, callback) {
                $http.get(GRIZZLY_URL + '/organization/' + orgId + '/post/' + adId + '/responses', userService.authHeader())
                    .success(function(data) {
                        callback(null, data);
                    }).error(function(data) {
                        callback(data);
                    });
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
                        type: 'warning',
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
                if (!n)
                    return;

                return new Array(Number(n));
            }
        };
    }
]);