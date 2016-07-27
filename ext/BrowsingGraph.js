'use strict';

// Represents a graph of urls as a user's history of web navigation
function BrowsingGraph() {
    this.urls = new Set();
    this.adj = new Map(); // id -> [id]
    this.utoi = new Map(); // url -> id
    this.itou = new Map(); // id -> url
    var _d3groups = [0];
    var id = 0;

    Array.prototype.copy = function () {
        var copy = new Array();
        this.forEach(function (elem) {
            copy.push(elem); 
        });
        return copy;
    }

    this.getUrls = function () {
        return Array.from(this.urls).copy();
    }

    this.getNodes = function () {
        return Array.from(this.itou.entries()).map(function (kv) {
            return {id: kv[0], url: kv[1], group: 0};
        });
    };

    this.getLinks = function () {
        var links = [];
        this.adj.forEach(function (ts, s) {
            ts.forEach(function (t) {
                links.push({source: s, target: t, value: 1});
            });
        });
        return links;
    };

    this.getGroups = function () {
        return _d3groups.copy();
    };
    
    this.toJSON = function() {
        return {
            nodes: this.getNodes(), 
            links: this.getLinks(),
            groups: this.getGroups()
        };
    };

    this.addNode = function(url) {
        if (!this.urls.has(url)) {
            this.urls.add(url);
            this.utoi.set(url,id);
            this.itou.set(id, url);
            id++;
        }
    };

    this.addLink = function(url_from, url_to) {
        this.addNode(url_from);
        this.addNode(url_to);
        var src = this.utoi.get(url_from);
        var dest = this.utoi.get(url_to);
        if (!this.adj.has(src)) {
            this.adj.set(src, new Set([dest]))
        } else {
            this.adj.get(src).add(dest);
        }
    };

    this.removeNode = function (url) {
        this.adj.delete(this.utoi.get(url));
        this.itou.delete(this.utoi.get(url));
        this.utoi.delete(url);
        this.urls.delete(url);
    };

    this.removeLink = function (from, to) {
        var f = this.utoi.get(from);
        var t = this.utoi.get(to);
        var newval = this.adj.get(f).filter(function (i) {
            return i != t;
        });
        this.adj.set(f, newval);
     };

    // Produces a json with nodes grouped by their old graphs
    this.mergeJSON = function(graphs) {
        graphs.push(this);
        var new_groups = new Map();
        graphs.forEach(function (g) {
            new_groups.set(g, new Map());
        });
        var g_ids = new Set();
        var new_id = 0;
        var _utoi = new Map();
        
        // Make unique group ids
        graphs.forEach(function (g) {
            var groups = new_groups.get(g);
            g.getGroups().forEach(function (g_id) {
                var key = 0;
                while (g_ids.has(key)) {
                    key++;
                }
                g_ids.add(key);
                groups.set(g_id, key);
            });
        });

        // Rebuild nodes and ids
        var nodes = [];
        graphs.forEach(function (g) {
            g.getNodes().forEach(function (n) {
                _utoi.set(n.url, new_id);
                var group = new_groups.get(g).get(n.group);
                nodes.push({
                    url: n.url, 
                    id: new_id++, 
                    group: group
                });
            });
        });

        // Rebuild links and ids
        var links = [];
        graphs.forEach(function (g) {
            g.getLinks().forEach(function (l) {
                var s = _utoi.get(g.itou.get(l.source));
                var t = _utoi.get(g.itou.get(l.target));
                links.push({
                    source: s,
                    target: t,
                    value: 1
                });
            });
        });

        return {groups: Array.from(g_ids), nodes: nodes, links: links};
    };
}
