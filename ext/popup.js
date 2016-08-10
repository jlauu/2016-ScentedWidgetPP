'use strict';
// Graph layout and display configuration
var config = {
    node_style_fill: function (d) {return d.cluster;},
    node_style_stroke: function (d) {
        if (d.cluster_type) {
            return "white";
        } else {
            return d.url === config.url ? "black" : "white";
        }
    },
    node_attr_r: function (d) {
        if (d.cluster_type) {
           return 8;
        } else { 
           return d.url === config.url ? 8 : 5;
        }
    },
    node_key: function (d) {return d.cluster+d.id;},
    gravity: .1,
    charge: -100,
    linkDistance: 30,
    linkStrength: .5,
    tabs: null,
    json: null,
    url: null
};

var cluster_data = null;

function main () {
    var popup_url = URI(document.URL);
    // Render from a request
    if (popup_url.hasQuery('cluster')) {
        var name = popup_url.query().split('=')[1];
        name = decodeURIComponent(name);
        chrome.runtime.sendMessage({type: 'cluster_query', name: name}, function (response) {
            if (!response) window.close();
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
                    chrome.runtime.sendMessage({
                        type: 'register',
                        tab: config.tab,
                        cluster_id: response.json.name
                    });
                    getClusterResponse(response.json, draw);
                });
        });
}

// Expects config.json to be defined
function draw() {
    SWPP.init(config);
    drawTitle();
    drawKeywords();
    drawSelectionButtons();
    drawNewClusterField();
}

function drawNewClusterField() {
    createInputBox('new-sub-cluster', 'Form cluster', function (name) {
        var nodes = SWPP.getLassoSelection();
        var data = nodes.data();
        if (data) {
            var links = config.json.links.filter(function (l) {
                return ['source','target'].every(function (prop) {
                    return data.some(function (d) {
                        return l[prop] === d;
                    });
                });
            }).map(function (l) {
                return {from: l.source.url, to: l.target.url};  
            });
            // Create new cluster and initialize it
            chrome.runtime.sendMessage({
                type:'cluster_new',
                name: name,
                urls: data.map(function (d) {return d.url;}),
                links: links,
                parent: cluster_data.name,
            });
            // Delete nodes from their old clusters
            removeFromCluster();
        }
    });
}

function drawSelectionButtons() {
    d3.select("#lasso-functions").append("button")
        .text("Remove Selected")
        .on("click", removeFromCluster);
}

function drawKeywords() {
    createInputBox('keywords', 'Add Keyword', function (kws) {
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
    var input_id = '#'+id+'-input';
    function clickhandler (input) {
        callback(input);
        d3.select(input_id)
            .attr('placeholder', cluster_data.name);
    }
    function getText() {
        return d3.select(input_id)[0][0].value;
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
                callback(getText());
        });
   var apply = box.append('button')
        .attr('id', id + '-button')
        .attr('name','apply')
        .text('Apply')
        .on('click', function () {callback(getText());});
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
    config.children = cluster_data.children;
    callback();
}

function removeFromCluster() {
    var nodes = SWPP.getLassoSelection();
    nodes.remove();
    nodes = nodes.data();
    nodes.forEach(function (n) {
        if (n.cluster_type) {
            chrome.runtime.sendMessage({
                'type':'cluster_edit',
                'edit_type': 'remove',
                'name': cluster_data.name,
                'children': [n.name]                
            });
        } else {
            chrome.runtime.sendMessage({
                'type':'cluster_edit',
                'edit_type': 'remove',
                'name': n.cluster,
                'nodes': [n.url]
            });
        }
    });
    window.location = window.location;
}

function editClusterName() {
    var name = d3.select('#cluster-title-input')[0][0].value;
    chrome.runtime.sendMessage({
        'type':'cluster_edit',
        'name': cluster_data.name,
        'new_name': name
    });
    cluster_data.name = name;
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
