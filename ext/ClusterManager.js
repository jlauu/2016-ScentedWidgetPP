'use strict';

var ClusterManager = (function () {
    var instance;
    var QUERY_MSG_NAME = 'cluster_query';

    function init(id) {
        var userid = id;
        var clusters = {};
        var uname_id = 0;

        // Returns list of clusters for userid
        function getClusters() {
            return []; 
        } 

        getClusters().forEach(function (c) {
            clusters[c.name] = c;
        });

        function mkCluster(name, url) {
            if (!name) {
                name = '_unnamed' + uname_id.toString();
                uname_id++;    
            }   
            var cluster = new UserCluster(name, [], null); 
            cluster.addUrl(url);
            clusters[name] = cluster;
        }

        function get(name) {
            return clusters[name];
        }

        function addToCluster(name, urls, links) {
            var c = get(name);
            urls.forEach(function (url) {
                c.addUrl(url);
            });

            links.forEach(function (link) {
                c.addLink(link.from, link.to);
            });

        }

        function getClustersByUrl(url) {
            var results = [];
            for (var c in clusters) {
                if (c.hasUrl(url)) {
                    results.push(c);
                }
            }
            return results;
        }
        return {
            query_message_name: QUERY_MSG_NAME,
            mkCluster: mkCluster,
            addToCluster : addToCluster,
            get : get,
            getClusters : getClusters,
            getClustersByUrl : getClustersByUrl
        }
    }

    return {
        getInstance : function(userid) {
            if (!instance) {
                instance = init(userid);
            }
            return instance;
        }
    };


})();
