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
    var popup_url = URI(document.URL);
    // Render from a request
    if (popup_url.hasQuery('cluster')) {
        var name = popup_url.query().split('=')[1];
        chrome.runtime.sendMessage({type: 'cluster_query', name: name}, function (response) {
            if (response.jsons && response.jsons.length > 0) {
                setPopupSize('auto', 'auto');
                getClusterResponse(response.jsons[0], draw);   
            }
        });
    // Render view based on current tab url
    } else {
        chrome.tabs.query({'active': true, 'currentWindow': true}, function (tabs) {
            if (tabs.length >= 0 && tabs[0].url) {
                config.tab = tabs[0];
                var url = normalizeUrl(tabs[0].url);
                config.url = url;
                chrome.runtime.sendMessage({type: 'cluster_query', url: url}, function (response) {
                    if (response.jsons && response.jsons.length > 0) {
                        setPopupSize(600,500);
                        getClusterResponse(response.jsons[0], draw);
                    } else {
                        promptNewCluster();
                    }
                });
            }
        });
    }
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
                    setPopupSize(600,500);
                    getClusterResponse(response.json, draw);
                });
        });
}

// Expects config.json to be defined
function draw() {
    SWPP.init(config);
    drawTitle();
    drawKeywords();
}

function drawKeywords() {
    createInputBox('keywords', 'Add Keyword', function () {
        var kws = d3.select('#keywords-input')[0][0].value;
        kws = kws.split(' ');
        kws.forEach(function (kw) {
            cluster_data.keywords.push(kw);
        })
        addKeywords(kws);
        refreshKeywords();
    });
    refreshKeywords();
}

function refreshKeywords() {
    d3.select('#keywords-list').selectAll('p')
        .data(cluster_data.keywords, function (d) {return d;})
      .enter()
        .append('p')
        .text(function(d) {return d;});
}

function drawTitle() {
   var setTitle = function () {
        if (cluster_data.name.includes('_unnamed')) {
            return 'Untitled (Click to set)';
        } else {
            return cluster_data.name;
        }
   };
   createInputBox('cluster-title', setTitle, editClusterName);
}

function createInputBox(id, title, callback) {
    function clickhandler () {
        callback();
        d3.select('#'+id+'-input')
            .attr('placeholder', cluster_data.name);
    }
    var box = d3.select('#'+id);
    var input = box.append('input')
        .attr('id', id + '-input')
        .attr('inputmode', 'verbatim')
        .attr('maxlength', 20)
        .attr('pattern', '[a-zA-Z0-9._]')
        .attr('type', 'text')
        .attr('placeholder', title)
        .on('keydown', function () {
            if (d3.event.key == 'Enter') 
                callback();
        });
   var apply = box.append('button')
        .attr('id', id + '-button')
        .attr('name','apply')
        .text('Apply')
        .on('click', callback);
}

function setPopupSize(w, h) {
    d3.select('html','body')
        .style('width', w)
        .style('height', h)
}
// Sets the config and cluster_data
function getClusterResponse(data, callback) {
    cluster_data = data;
    config.json = cluster_data.graph;
    saveCluster();
    callback();
}


function saveCluster() {
    chrome.runtime.sendMessage({
        type:'register', 
        tab: config.tab,
        cluster_id: cluster_data.name
    });
}

function editClusterName() {
    var name = d3.select('#cluster-title-input')[0][0].value;
    chrome.runtime.sendMessage({
        'type':'cluster_edit',
        'name': cluster_data.name,
        'new_name': name
    });
    cluster_data.name = name;
    saveCluster();
}

function addKeywords(kws) {
    chrome.runtime.sendMessage({
        type: 'cluster_edit',
        edit_type: 'add',
        name: cluster_data.name,
        keywords: kws
    });
}

main();
