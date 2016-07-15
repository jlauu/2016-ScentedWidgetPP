'use strict';

function UserCluster(name, keywords, graph) {
    this.name = name;
    this.keywords = new Set(keywords) || new Set();
    this.graph = new BrowsingGraph();

    if (graph) {
        graph.nodes.forEach(function (n) {
            this.graph.addNode(n.url);
        }, this);
        graph.links.forEach(function (l) {
            var srcURL = graph.nodes.find(function (n) {
                return n.id == l.source;
            }).url;
            var tgtURL = graph.nodes.find(function (n) {
                return n.id == l.target;
            }).url;
            this.graph.addLink(srcURL, tgtURL);
        }, this);
    }

    this.addUrl = function (url) {
        this.graph.addNode(url);
    }

    this.addLink = function(url_from, url_to) {
        this.graph.addLink(url_from, url_to);
    }
    
    this.addKeyword = function (kw) {
        this.keywords.add(kw); 
    }

    this.removeKeywords = function (kws) {
        kws.forEach(function (kw) {
            this.keywords.delete(kw);
        }, this);
    }

    this.hasUrl = function (url) {
        return this.graph.urls.has(url);
    }

    this.toJSON = function () {
        return {
            name: this.name,
            keywords: Array.from(this.keywords),
            cluster: this.graph.toJSON()
        };
    }
    
    // Produces a json with nodes grouped by their old clusters
    this.mergeJSON = function (cluster) {
        var name = this.name + "-" + cluster.name;
        var keywords = Array.from(new Set(this.keywords.concat(cluster.name)));
        var graph = this.graph.mergeJSON(cluster.graph);
        return {name: name, keywords: keywords, cluster: graph};
    }
}
