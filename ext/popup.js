'use strict';
// Graph layout and display configuration
var config = {
    node_style_fill: function (d) {return d.focus ? 2 : 1;},
    node_attr_r: 5,
    gravity: .2,
    charge: -500,
    linkDistance: 50,
    linkStrength: .5,
    tabs: null,
    json: null,
};

var cluster_data = null;

function main () {
    // Get current tab url
    chrome.tabs.query({'active': true, 'currentWindow': true}, function (tabs) {
        if (tabs.length >= 0 && tabs[0].url) {
            config.tab = tabs[0];
            var url = normalizeUrl(tabs[0].url);
            config.url = url;
            chrome.runtime.sendMessage({type: 'cluster_query', url: url}, function (response) {
                if (response.jsons && response.jsons.length > 0) {
                    getClusterResponse(response.jsons[0], draw);
                } else {
                    promptNewCluster();
                }
            });
        }
    });
}
// TODO: abstract to chrome background views?
// Sets the popup view to new cluster dialogue
function promptNewCluster() {
    setPopupSize(150,100);
    d3.select('body').append('div')
        .attr('id', 'create-cluster')
        .text('Create Cluster')
        .on("click", function() {
            chrome.runtime.sendMessage({type: 'cluster_new', url: config.url}, 
                function (response) {
                    d3.select('#create-cluster').remove();
                    getClusterResponse(response.json, draw);
                });
        });
}

// Expects config.json to be defined
function draw() {
    setPopupSize(600,500);
    var minimap = MiniSWPP.getInstance(config);
    minimap.start();
    drawTitle();
}

function drawTitle() {
    var setTitle = function () {
        if (cluster_data.name.includes('_unnamed')) {
            return 'Untitled (Click to set)';
        } else {
            return cluster_data.name;
        }
    };
    var box = d3.select('#cluster-title');
    var input = box.append('input')
        .attr('inputmode', 'verbatim')
        .attr('maxlength', 20)
        .attr('pattern', '[a-zA-Z0-9._]')
        .attr('type', 'text')
        .attr('placeholder', setTitle)
   var apply = box.append('button')
        .attr('name','apply')
        .text('Apply')
        .on('click', function () {
            var name = input[0][0].value;
            chrome.runtime.sendMessage({
                'type':'cluster_edit',
                'name': {'old':cluster_data.name,'new':name}
            });
            cluster_data.name = name;
            saveClusterData();
        });
}

function setPopupSize(w, h) {
    d3.select('html','body')
        .style('width', w)
        .style('height', h)
}
// Sets the config and cluster_data
function getClusterResponse(data, callback) {
    cluster_data = data;
    config.json = cluster_data.cluster;
    saveClusterData();
    callback();
}

function saveClusterData() {
    chrome.runtime.sendMessage({
        type:'register', 
        tab: config.tab,
        cluster_id: cluster_data.name}
    );
}

main();
