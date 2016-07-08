'use strict';

function BrowsingGraph() {
    this.adj = {};
    this.urls = new Set();
    this.nodes = {};
    var _d3nodes = [];
    var _d3links = []; 
    var id = 0;
    
    this.toJSON = function() {
        return {nodes : _d3nodes, links : _d3links, groups : [0]};
    }

    this.addNode = function(url) {
        if (!urls.has(url)) {
            urls.add(url);
            _d3nodes.push({'url' : url, 'id' : id++, group : [0]});
        }
    }

    this.addLink = function(url_from, url_to) {
        this.addNode(url_from);
        this.addNode(url_to);
        var src = this.nodes[url_from];
        var dest = this.nodes[url_to];
        if (!this.adj[src]) {
            this.adj[src] = new Set([dest])
        } else {
            this.adj[src].add(dest);
        }
        _d3links.push({source : src, target : dest, value : 1});
    }

    this.bindForceLayout = function (d3_force) {
        d3_force.nodes(_d3nodes);
        d3_force.links(_d3links);
    }
}
