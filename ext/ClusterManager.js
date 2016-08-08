'use strict';

var ClusterManager = (function () {
    var instance;
    var QUERY_MSG = 'cluster_query';
    var NEW_MSG = 'cluster_new';
    var EDIT_MSG = 'cluster_edit';
    var UNNAMED_PREFIX = '_unnamed';
    function init() {
        var clusters = new Map(); // str -> cluster
        var idCluster = new Map(); // id -> cluster
        var nameToId = new Map(); // str -> id
        var forest = new Map(); // id -> [id]
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
                return c ? c.toJSON() : [];
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

            // Delete cluster if empty
            if (c.getUrls.length <= 0) {
                clusters.delete(c.name);
                idCluster.delete(c.id);
                nameToId.delete(c.name);
            }
        }

        function editName(old, new_) {
            if (clusters.has(old)) {
                var c = clusters.get(old);
                c.name = new_;
                clusters.set(new_, c);
                nameToId.set(new_, c);
                clusters.delete(old);
                nameToId.delete(old);
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
            idCluster.set(cluster.id, cluster);
            nameToId.set(cluster.name, cluster.id);
        }

        // Cluster hierarchy operations
        function getParent(cname) {
            var c_id = nameToId.get(cname);
            var pair = Array.from(forest).find(function (p) {
                return p[1].has(c_id);
            });
            return pair && pair[0];
        }

        function setParent(cname, pname) {
            removeChild(getParent(cname), cname);
            if (pname == null) return;
            addChild(pname, cname);
        }

        function getChildren(name) {
            var id = nameToId.get(name);
            if (!id || !forest.has(id)) return [];
            return Array.from(forest.get(id))
                .map(function(id) {
                    return idCluster.get(id);
                });
        }

        function addChild(pname, cname) {
            var c_id = nameToId.get(cname);
            var p_id = nameToId.get(pname);
            removeChild(getParent(cname), cname);
            if (forest.has(p_id)) {
                forest.get(p_id).add(c_id);
            } else {
                forest.set(p_id, new Set([c_id]));
            }
        }

        function removeChild(pname, cname) {
            var c_id = nameToId.get(cname);
            var p_id = nameToId.get(pname);
            if (forest.has(p_id)) {
                forest.get(p_id).delete(c_id);
            }
        }

        function getHierarchyJSON() {
            return Array.from(forest.entries())
                .map(function (pair) {
                    var json = {
                        parent: pair[0], 
                        children: Array.from(pair[1])
                    };
                    return json;
                });
        }

        function loadHierarchyJSON(json) {
            json.forEach(function (o) {
                forest.set(o.parent, new Set(o.children));
            });
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
            search: search,
            getParent: getParent,
            setParent: setParent,
            getChildren: getChildren,
            addChild: addChild,
            removeChild: removeChild,
            getHierarchyJSON: getHierarchyJSON,
            loadHierarchyJSON: loadHierarchyJSON
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
