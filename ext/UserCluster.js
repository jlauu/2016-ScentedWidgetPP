'use strict';

function UserCluster(name, keywords, graph) {
    this.name = name;
    this.keywords = keywords || [];
    this.graph = graph || new BrowsingGraph();

    this.addUrl = function (url) {
        this.graph.addNode(url);
    }

    this.addLink = function(url_from, url_to) {
        this.graph.addLink(url_from, url_to);
    }

    this.hasUrl = function (url) {
        return this.graph.urls.has(url);
    }

    this.toJSON = function () {
        return this.graph.toJSON();
    }
}


