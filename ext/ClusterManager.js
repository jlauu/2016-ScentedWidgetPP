'use strict';

var ClusterManager = (function () {
    var instance;
    var QUERY_MSG = 'cluster_query';
    var NEW_MSG = 'cluster_new';
    var EDIT_MSG = 'cluster_edit';
    var UNNAMED_PREFIX = '_unnamed';
    function init(id) {
        var userid = id;
        var clusters = new Map();
        var uname_id = 0;

        function getClusters() {
            return Array.from(clusters.values());
        } 

        function mkCluster(name, url) {
            if (!name) {
                name = UNNAMED_PREFIX + uname_id.toString();
                uname_id++;    
            }   
            var cluster = new UserCluster(name, [], null); 
            cluster.addUrl(url);
            clusters.set(name, cluster);
            return cluster;
        }

        function get(name) {
            return clusters.get(name);
        }

        function addToCluster(name, urls, links, keywords) {
            var c = get(name);
            urls.forEach(function (url) {
                c.addUrl(url);
            });

            links.forEach(function (link) {
                c.addLink(link.from, link.to);
            });
            c.addKeywords(keywords);
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
        return {
            UNNAMED_PREFIX: UNNAMED_PREFIX,
            query_message_name: QUERY_MSG,
            new_message_name: NEW_MSG,
            edit_message_name: EDIT_MSG,
            mkCluster: mkCluster,
            addToCluster: addToCluster,
            get: get,
            getClusters: getClusters,
            getClustersByUrl: getClustersByUrl,
            editName: editName
        }
    }

    return {
        getInstance: function(userid) {
            if (!instance) {
                instance = init(userid);
            }
            return instance;
        }
    };


})();
