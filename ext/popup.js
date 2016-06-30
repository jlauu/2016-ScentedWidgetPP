'use strict';

// Pull graph data from local/sync storage, else fetch from webhost
function init() {
    chrome.storage.sync.get('swpp_graph', function (o) {
        if (o.swpp_graph) {
            MiniSWPP.init(o.swpp_graph);
        } else {
            var xhr = new XMLHttpRequest();
            var userid = chrome.extension.getBackgroundPage().session.userID;
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    var json = JSON.parse(xhr.responseText);
                    chrome.tabs.query({
                        'active': true,
                        'currentWindow': true
                    }, function (tabs) {
                        MiniSWPP.init(tabs[0].url, json);
                    });
/*                    chrome.storage.sync.set({'swpp_graph':json}, function () {*/
/*                        console.log("graph stored");*/
/*                    });*/
                }
            }
            xhr.open("GET", "https://swpp-server-stage.herokuapp.com/?uid="+userid, true);
            xhr.send();
        }
    });
}

// Minimap: navigation and graph labelling/editing
var MiniSWPP = (function () {
    var swpp = {
        width: window.innerWidth,
        height: window.innerHeight,
        svg: null,
        data: null,
        force: null,
        links: [],
        nodes: [],
    };

    function resize() {
        swpp.width = window.innerWidth;
        swpp.height = window.innerHeight;
        swpp.svg
            .attr("viewBox", "0 0 "+swpp.width+" "+swpp.height)
            .attr("width", swpp.width)
            .attr("height", swpp.width);
        swpp.force.size([swpp.width,swpp.height]).resume();
    }

    function emptyGraph() {
        return {'nodes':[],'links':[],'groups':[]};
    }

    function eqURL(url_a, url_b) {
        var parser = document.createElement('a');
        parser.href = url_a;
        url_a = parser.href;
        parser.href = url_b;
        url_b = parser.href;
        return url_a == url_b;
    }

    swpp.getClusterFromUrl = function (url, graph) {
        var node = graph.nodes.find(function (n) {
            return eqURL(n.url, url);
        });
        if (!node) return emptyGraph();
        var group_id = node.group;
        var nodes = [];
        graph.nodes.forEach(function (n) {
            if (n.group == group_id) {
                if (eqURL(url, n.url)) {
                    n.focus = true;
                } else {
                    n.focus = false;
                }
                nodes.push(n);
            }
        });
        var links = [];
        graph.links.forEach(function (e) {
            var sourceNode = graph.nodes.find(function (n) {
                return n.id === e.source;
            });
            var targetNode = graph.nodes.find(function (n) {
                return n.id === e.target;
            })
            if (sourceNode.group == group_id || targetNode.group == group_id) {
                links.push({
                    source: sourceNode,
                    target: targetNode,
                    value: e.value
                });
            }
        });
        return {'nodes':nodes, 'links':links, 'groups':[group_id]};
    }

    swpp.init = function (url, json) {
        var width = swpp.width;
        var height = swpp.height;

        var force = d3.layout.force()
            .charge(-120)
            .gravity(0.3)
            .linkDistance(15)
            .linkStrength(.2)
            .size([width,height])
        swpp.force = force;
        
        var color = d3.scale.category20();
        var svg = d3.select("div.svg-container").append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .classed("svg-content-responsive", true);
        swpp.svg = svg;
        resize()
        d3.select(window).on('resize', function () {
            resize();
        });

        swpp.data = json;
        var graph = swpp.getClusterFromUrl(url, json);
        swpp.nodes = graph.nodes;
        swpp.links = graph.links;

        force
            .nodes(swpp.nodes)
            .links(swpp.links)
            .on("tick", tick)
            .start();

        // build the arrow.
        svg.append("svg:defs").selectAll("marker")
            .data(["end"])      // Different link/path types can be defined here
          .enter().append("svg:marker")    // This section adds in the arrows
            .attr("id", String)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 15)
            .attr("refY", -1.5)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
          .append("svg:path")
            .attr("d", "M0, 0L0,0L0,5");

        // add the links and the arrows
        var path = svg.append("svg:g").selectAll("path")
            .data(force.links())
          .enter().append("svg:path")
        //    .attr("class", function(d) { return "link " + d.type; })
            .attr("class", "link")
            .attr("marker-end", "url(#end)");

        var nodes = svg.selectAll(".node")
            .data(force.nodes(), function (d) {return d.id;})
          .enter().append("g")
            .attr("class", "node")
            .attr("cx", function (d) {return d.x;})
            .attr("cy", function (d) {return d.y;})
            .style("fill", function (d) {
                return color(d.focus ? 10 : 0); 
            })
            .call(force.drag)
            .on("dblclick", function (d) {
                var win = window.open(d.url, '_blank');
                win.focus();
            });

        nodes.append("circle")
            .attr("r", function (d) {return d.focus ? 7 : 5;});

        // define nodes and data bindings
        function tick(e) {
            path.attr("d", function(d) {
                var dx = d.target.x - d.source.x,
                    dy = d.target.y - d.source.y,
                    dr = Math.sqrt(dx * dx + dy * dy);
                return "M" + 
                    d.source.x + "," + 
                    d.source.y + "A" + 
                    dr + "," + dr + " 0 0,1 " + 
                    d.target.x + "," + 
                    d.target.y;
            });
            nodes.attr("transform", function (d, i) {
                return ["translate(",d.x,",",d.y,")"].join(" ");
            });
        }
    };

    return swpp;
}());

init();
