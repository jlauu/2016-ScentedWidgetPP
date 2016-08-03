'use strict';
var config = {
    charge: -.02,
    gravity: 0,
    linkDistance: 40,
    linkStrength: 1,
    friction: .2,
    groupToCluster: null,
    keywords: null
};

var cluster_data = {};

function main () {
    chrome.runtime.sendMessage({
            type: "cluster_query", 
            combine: true
    }, function (response) {
        if (response.jsons && response.jsons.length > 0) {
            cluster_data = response.jsons[0];
            config.json = cluster_data.graph;
            config.keywords = cluster_data.keywords;
            config.groupToCluster = cluster_data.clusters;
            SWPP.init(config);
            SWPP.ring_shift_right();
        }
    });
}

main()
