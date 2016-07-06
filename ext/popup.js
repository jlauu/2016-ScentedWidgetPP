'use strict';
(function () {
    var config = {
        minimap: null,
        node_style_fill: function (d) {return d.focus ? 2 : 1;},
        node_attr_r: 5,
        eqURL: function (url_a, url_b) {
            var parser = document.createElement('a');
            parser.href = url_a;
            url_a = parser.href;
            parser.href = url_b;
            url_b = parser.href;
            return url_a == url_b;
        },
        preprocess: function (config) {
            var graph = {nodes:[], links:[], groups:[]};
            var url = config.tab.url;
            // Find the node for the url of the tab we are in
            var node = config.json.nodes.find(function (n) {
                return config.eqURL(n.url, url);
            });
            if (!node) return graph;
            var group_id = node.group;
            graph.groups.push(group_id);
            // Build nodes array
            config.json.nodes.forEach(function (n) {
                if (n.group == group_id) {
                    // If it is the same node as the s
                    if (config.eqURL(url, n.url)) {
                        n.focus = true;
                    } else {
                        n.focus = false;
                    }
                    graph.nodes.push(n);
                }
            });
            // Build links array
            config.json.links.forEach(function (e) {
                var sourceNode = config.json.nodes.find(function (n) {
                    return n.id === e.source;
                });
                var targetNode = config.json.nodes.find(function (n) {
                    return n.id === e.target;
                });
                if (sourceNode.group == group_id || targetNode.group == group_id) {
                    graph.links.push({
                        source: sourceNode,
                        target: targetNode,
                        value: e.value
                    });
                }
            });
            return graph;
        }
    };

    // Minimap: navigation and graph labelling/editing
    var SWPP = (function () {
        var instance;

        function init(config) {
            var width = window.innerWidth;
            var height = window.innerHeight;
            var svg;  
            var data; 
            var graph;
            var force;
            var path;
            var nodes;
            
            // Private

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

            function resize() {
                width = window.innerWidth;
                height = window.innerHeight;
                svg
                  .attr("viewBox", "0 0 "+width+" "+height)
                  .attr("width",  width)
                  .attr("height", height);
                force.size([width,height]).resume();
            }
            
            // Public
            
            return {
                width: width,
                height: height,
                // Process and return the graph to be used/displayed
                preprocess: function (config) {
                    return config.json;
                },
                // Start/initialize d3's force layout
                start: function () {
                    force = d3.layout.force()
                        .charge(config.charge || -120)
                        .gravity(config.gravity || 0.3)
                        .linkDistance(config.linkDistance || 15)
                        .linkStrength(config.linkStrength || .2)
                        .size([width,height])
                    
                    var color = d3.scale.category20();
                    svg = d3.select("div.svg-container").append("svg")
                        .attr("preserveAspectRatio", "xMinYMin meet")
                        .classed("svg-content-responsive", true);
                    resize()
                    d3.select(window).on('resize', function () {
                        resize();
                    });

                    graph = this.preprocess(config);
                    force
                        .nodes(graph.nodes)
                        .links(graph.links)
                        .on("tick", tick)
                        .start()

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
                        .attr("d", "M0, -5L10,0L0,5");

                    // add the links and the arrows
                    path = svg.append("svg:g").selectAll("path")
                        .data(force.links())
                      .enter().append("svg:path")
                    //    .attr("class", function(d) { return "link " + d.type; })
                        .attr("class", "link")
                        .attr("marker-end", "url(#end)");

                    nodes = svg.selectAll(".node")
                        .data(force.nodes(), function (d) {return d.id;})
                      .enter().append("g")
                        .attr("class", "node")
                        .attr("cx", function (d) {return d.x;})
                        .attr("cy", function (d) {return d.y;})
                        .style("fill", function (d) {
                            return color(config.node_style_fill || d.group); 
                        })
                        .call(force.drag)

                    nodes.append("circle")
                        .attr("r", config.node_attr_r || 5);
                }
            };
        }
        return {
            getInstance: function (config) {
                if (!instance) {
                    instance = init(config);
                }
                return instance;
            }
       };
    })();

    // Pull graph data from local/sync storage, else fetch from webhost
    chrome.storage.sync.get('swpp_graph', function (o) {
        var xhr = new XMLHttpRequest();
        var userid = chrome.extension.getBackgroundPage().session.userID;
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                var json = JSON.parse(xhr.responseText);
                chrome.tabs.query({
                    'active': true,
                    'currentWindow': true
                }, function (tabs) {
                    config.json = json;
                    config.tab = tabs[0];
                    var minimap = SWPP.getInstance(config);
                    start_graph(minimap);                   
                });
/*                    chrome.storage.sync.set({'swpp_graph':json}, function () {*/
/*                        console.log("graph stored");*/
/*                    });*/
            }
        }
        xhr.open("GET", "https://swpp-server-stage.herokuapp.com/?uid="+userid, true);
        xhr.send();
    });

    function start_graph(minimap) {
        minimap.preprocess = config.preprocess;
        config.minimap = minimap;
        minimap.start();
    }
})();
