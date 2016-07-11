'use strict';

// Represents a graph of urls as a user's history of web navigation
function BrowsingGraph() {
    this.urls = new Set();
    this.adj = new Map(); // id -> [id]
    this.utoi = new Map(); // url -> id
    this.itou = new Map(); // id -> url
    var _d3nodes = [];
    var _d3links = [];
    var _d3groups = [0];
    var id = 0;
    
    this.toJSON = function() {
        return {nodes : _d3nodes, links : _d3links, groups : _d3groups};
    }

    // Produces a json with nodes grouped by their old graphs
    this.mergeJSON = function(graph) {
        var new_id = 0;
        var _utoi = new Map();
        var nodes = Array.from(this.urls).map(function (url) {
            _utoi.set(url, new_id);
            return {url: url, id: new_id++, group: 0};
        });
        Array.from(graph.urls).forEach(function (url) {
            _utoi.set(url, new_id);
            nodes.push({url: url, id: new_id++, group: 1});
        });
        var addLinkFunc = function (graph) {
            return function (l) {
                var s = _utoi.get(graph.itou.get(l.source));
                var t = _utoi.get(graph.itou.get(l.source));
                return {source: s, target: t, value: 1};
            };
        };
        var links = this._d3links.map(addLinkFunc(this));
        links.concat(graph._d3links.map(addLinkFunc(graph)));
        return {nodes: nodes, links: links, groups: [0,1]};
    }

    this.addNode = function(url) {
        if (!this.urls.has(url)) {
            this.urls.add(url);
            this.utoi.set(url,id);
            this.itou.set(id, url);
            _d3nodes.push({'url': url, 'id': id, group: 0});
            id++;
        }
    }

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
        _d3links.push({source : src, target : dest, value : 1});
    }

    this.bindForceLayout = function (d3_force) {
        d3_force.nodes(_d3nodes);
        d3_force.links(_d3links);
    }
}
