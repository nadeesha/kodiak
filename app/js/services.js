'use strict';

var services = angular.module('kodiak.services', []);

services.factory('userService', ['$rootScope', '$localStorage', '$http', 'GRIZZLY_URL',
    function($rootScope, $localStorage, $http, GRIZZLY_URL) {
        var model = {
            firstName: null,
            lastName: null,
            email: null,
            access_token: null,
            expiration: null,
            affiliation: null,
            restored: false
        };

        var service = {
            authHeader: function() {
                service.restoreState();

                var config = {
                    headers: {
                        Authorization: 'Bearer ' + model.access_token
                    }
                };

                return config;
            },

            userType: function() {
                service.restoreState();

                if (model.restored && model.affiliation)
                    return 'ORG';
                else if (model.restored && !model.affiliation)
                    return 'PERSONAL';
            },

            user: function() {
                return _.pick(model, 'firstName', 'lastName', 'email', 'affiliation')
            },


            saveState: function() {
                localStorage.user = angular.toJson(model);
            },

            restoreState: function() {
                if (!model.restored && localStorage.user) {
                    model = angular.fromJson(localStorage.user);
                    model.restored = true;
                }
            },

            create: function(user, callback) {
                $http.put(GRIZZLY_URL + '/user', JSON.stringify(user))
                    .success(function() {
                        model.firstName = user.firstName;
                        model.lastName = user.lastName;
                        model.email = user.email;
                        service.saveState();

                        callback();
                    }).error(function(data, status) {
                        callback(status);
                    });
            },

            login: function(user, callback) {
                $http.put(GRIZZLY_URL + '/user/token', JSON.stringify(user))
                    .success(function(data) {
                        model.email = user.email;
                        model.access_token = data.access_token;
                        model.expiration = data.expiration;
                        model.affiliation = data.affiliation;
                        service.saveState();

                        callback(null, data.affiliation);
                    }).error(function(data, status) {
                        callback(status);
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
                        callback(status);
                    });
            },

            getProfile: function(callback) {
                $http.get(GRIZZLY_URL + '/user/profile/me', service.authHeader())
                    .success(function(data) {
                        callback(null, data);
                    }).error(function(data) {
                        callback(data, null);
                    });
            },

            getProfileStats: function(callback) {
                $http.get(GRIZZLY_URL + '/user/profile/me/stats', service.authHeader())
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

                $http.post(GRIZZLY_URL + '/user/profile/me', JSON.stringify(user), service.authHeader())
                    .success(function() {
                        callback();
                    }).error(function(data) {
                        callback(data);
                    });
            }
        };

        $rootScope.$on('restorestate', service.restoreState);

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
                    })
                    .error(function(data) {
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

services.factory('notificationService', [
    function() {
        return {
            notify: function(hash) {
                $.pnotify(hash);
            },

            handleError: function(msg) {
                this.notify({
                    title: 'Something went wrong!',
                    text: msg ? msg : 'Unknown Error',
                    type: 'error',
                    hide: true
                });
            },

            handleSuccess: function(msg) {
                this.notify({
                    title: 'Success!',
                    text: msg ? msg : 'Everything went ok.',
                    type: 'success',
                    hide: true
                });
            }
        };
    }
]);

services.factory('validationService', ['notificationService',
    function(notificationService) {
        return {
            isTrue: function(expression, msg) {
                if (!expression) {
                    notificationService.notify({
                        title: 'Ooops!',
                        text: msg,
                        type: 'error',
                        hide: true
                    });

                    throw msg;
                }
            }
        }
    }
]);