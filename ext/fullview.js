'use strict';
var config = {
    charge: -1000,
    chargeDistance: 70,
    gravity: 0,
    linkDistance: 40,
    linkStrength: .8,
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
            if (cluster_data.clusters) {
                config.groupToCluster = cluster_data.clusters;
            } else {
                config.groupToCluster = {'0': cluster_data.name};
            }
            SWPP.init(config);
            SWPP.ring_shift_right();
        }
    });
}

main()
