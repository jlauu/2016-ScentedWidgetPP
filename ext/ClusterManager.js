'use strict';

var ClusterManager = (function () {
    var instance;
    var QUERY_MSG = 'cluster_query';
    var NEW_MSG = 'cluster_new';
    var EDIT_MSG = 'cluster_edit';
    var UNNAMED_PREFIX = '_unnamed';
    function init() {
        var clusters = new Map();
        var ids = new Map();
        var uname_id = 0;

        function getClusters() {
            return Array.from(clusters.values());
        } 

        function search(text) {
            var results = getClusters().filter(function (c) {
                return c.getKeywords().some(function (kw) {
                    return kw.toLowerCase().includes(text.toLowerCase());
                });
            });
            return results;
        }

        function getCombined() {
            var cs = getClusters();
            var c = cs.pop();
            if (cs.length) {
                return c.mergeJSON(cs);
            } else {
                return c.toJSON();
            }
        }

        function mkCluster(name, url) {
            if (!name) {
                name = UNNAMED_PREFIX + uname_id.toString();
                uname_id++;    
            }   
            var cluster = new UserCluster(name, [], null); 
            if (url) cluster.addUrl(url);
            clusters.set(name, cluster);
            return cluster;
        }

        function get(name) {
            return clusters.get(name);
        }

        function has(name) {
            return clusters.has(name);
        }

        function hasId(name) {
            var c = clusters.get(name);
            return c && c.id;
        }

        function addToCluster(name, urls, links, keywords) {
            var c = get(name);
            if (urls) {
                urls.forEach(function (url) {
                    c.addUrl(url);
                });
            }
            if (links) {
                links.forEach(function (link) {
                    c.addLink(link.from, link.to);
                });
            }
            if (keywords) {
                keywords.forEach(function (kw) {
                    c.addKeyword(kw);
                });
            }
        }

        function removeFromCluster(name, urls, links, keywords) {
            var c = get(name);
            if (urls) {
                urls.forEach(function (url) {
                    c.removeUrl(url);
                });
            }
            if (links) {
                links.forEach(function (link) {
                    c.removeLink(link.from, link.to);
                });
            }
            if (keywords) {
                keywords.forEach(function (kw) {
                    c.removeKeyword(kw);
                });
            }

            if (c.getUrls.length <= 0) {
                clusters.delete(c.name);
                ids.delete(c.id);
            }
        }

        function editName(old, new_) {
            if (clusters.has(old)) {
                var c = clusters.get(old);
                c.name = new_;
                clusters.set(new_, c);
                clusters.delete(old);
            }
        }

        function getClustersByUrl(url) {
            return getClusters().filter(function (c) {return c.hasUrl(url);});
        }

        // Loads a cluster from json
        function loadJSON(json) {
            var cluster = new UserCluster(json.name, json.keywords, json.graph);
            if (json.id) cluster.id = json.id;
            clusters.set(cluster.name, cluster);
            ids.set(cluster.id, cluster);
        }

        return {
            UNNAMED_PREFIX: UNNAMED_PREFIX,
            query_message_name: QUERY_MSG,
            new_message_name: NEW_MSG,
            edit_message_name: EDIT_MSG,
            mkCluster: mkCluster,
            addToCluster: addToCluster,
            removeFromCluster: removeFromCluster,
            loadJSON: loadJSON,
            get: get,
            has: has,
            hasId: hasId,
            getClusters: getClusters,
            getCombined: getCombined,
            getClustersByUrl: getClustersByUrl,
            editName: editName,
            search: search
        }
    }

    return {
        getInstance: function() {
            if (!instance) {
                instance = init();
            }
            return instance;
        }
    };


})();
