'use strict';

function UserCluster(name, keywords, graph) {
    this.name = name;
    this.keywords = new Set(keywords) || new Set();
    this.graph = graph || new BrowsingGraph();

    this.addUrl = function (url) {
        this.graph.addNode(url);
    }

    this.addLink = function(url_from, url_to) {
        this.graph.addLink(url_from, url_to);
    }
    
    this.addKeywords = function (kws) {
        kws.forEach(function (kw) {
            keywords.add(kw); 
        });
    }

    this.removeKeywords = function (kws) {
        kws.forEach(function (kw) {
            keywords.delete(kw);
        });
    }

    this.hasUrl = function (url) {
        return this.graph.urls.has(url);
    }

    this.toJSON = function () {
        return {name: this.name, keywords: this.keywords, cluster: this.graph.toJSON()};
    }
    
    // Produces a json with nodes grouped by their old clusters
    this.mergeJSON = function (cluster) {
        var name = this.name + "-" + cluster.name;
        var keywords = Array.from(new Set(this.keywords.concat(cluster.name)));
        var graph = this.graph.mergeJSON(cluster.graph);
        return {name: name, keywords: keywords, cluster: graph};
    }
}
