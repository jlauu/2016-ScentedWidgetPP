'use strict';

// layout and display configuration
var config = {
    node_style_fill: function (d) {return d.focus ? 2 : 1;},
    node_attr_r: 5,
    tabs: null,
    json: null, // use fetchData
};

var app;

function main () {
    // Get current tab url
    chrome.tabs.query({'active': true, 'currentWindow': true}, function (tabs) {
        if (tabs.length >= 0 && tabs[0].url) {
            var url = tabs[0].url;
            config.url = url;
            chrome.runtime.sendMessage({type: 'cluster_query', url: url}, function (response) {
                if (response.jsons && response.jsons.length > 0) {
                    config.json = response.jsons[0];
                    drawGraph();
                } else {
                    promptNewCluster();
                }
            });
        }
    });
}

function setPopupSize(w, h) {
    d3.select('html','body')
        .style('width', w)
        .style('height', h)
}

function promptNewCluster() {
    setPopupSize(150,300);
    d3.select('body').append('div')
        .attr('id', 'create-cluster')
        .text('Create Cluster')
        .on("click", function() {
            chrome.runtime.sendMessage({type : 'cluster_new', url : config.url},
                                        function (response) {
                d3.select('#create-cluster').remove();
                config.json = response.json;
                setPopupSize(600,500);
                drawGraph();
            });
        });
}

function drawGraph() {
    console.log(config);
    var minimap = MiniSWPP.getInstance(config);
    minimap.start();
    app = minimap;
}

var MiniSWPP = (function () {
    // Popup version extensions with labelling and editing
   var mixin = (function() {
       function eqURL (url_a, url_b) {
           var parser = document.createElement('a');
           parser.href = url_a;
           url_a = parser.href;
           parser.href = url_b;
           url_b = parser.href;
           return url_a == url_b;
       }

       // Extend the base graph prototype. Called by the base interface
       function applyExtension(SWPPGraph) {
//            SWPPGraph.prototype.preprocess = function (config) {
//                var graph = {nodes:[], links:[], groups:[]};
//                var url = config.tab.url;
//                // Find the node for the url of the tab we are in
//                var node = config.json.nodes.find(function (n) {
//                    return eqURL(n.url, url);
//                });
//                if (!node) return graph;
//                var group_id = node.group;
//                graph.groups.push(group_id);
//                // Build nodes array
//                config.json.nodes.forEach(function (n) {
//                    if (n.group == group_id) {
//                        // If it is the same node as the s
//                        if (eqURL(url, n.url)) {
//                            n.focus = true;
//                        } else {
//                            n.focus = false;
//                        } graph.nodes.push(n);
//                    }
//                });
//                // Build links array
//                config.json.links.forEach(function (e) {
//                    var sourceNode = config.json.nodes.find(function (n) {
//                        return n.id === e.source;
//                    });
//                    var targetNode = config.json.nodes.find(function (n) {
//                        return n.id === e.target;
//                    });
//                    if (sourceNode.group == group_id || 
//                        targetNode.group == group_id) {
//                        graph.links.push({
//                            source: sourceNode,
//                            target: targetNode,
//                            value: e.value
//                        });
//                    }
//                });
//                return graph;
//            }
            // set custom event handlers
//            SWPPGraph.prototype.postStart = function () {
//                this.nodes.on("dblclick", function (d) {
//                    chrome.tabs.update({url: d.url});
//                    var old = instance.nodes.find(function (d) {return d.focus;});
//                    if (old) old.focus = false;
//                    d.focus = true;
//                });
//            }
    }
    return {
        applyExtension: applyExtension
    };
   })();

    // Base graph interface
    var ExtendedSWPP = (function (mixin) {
        var instance;

        function SWPPGraph(config) {
            this.config = config || {};
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.svg = null;  
            this.data = null; 
            this.graph = null;
            this.force = null;
            this.path = null;
            this.nodes = null;
        }

        // Start/initialize d3's force layout
        SWPPGraph.prototype.start = function () {
            var config = this.config;
            this.force = d3.layout.force()
                .charge(config.charge || -120)
                .gravity(config.gravity || 0.3)
                .linkDistance(config.linkDistance || 15)
                .linkStrength(config.linkStrength || .2)
                .size([this.width,this.height])
            
            var color = d3.scale.category20();
            this.svg = d3.select("div.svg-container").append("svg")
                .attr("preserveAspectRatio", "xMinYMin meet")
                .classed("svg-content-responsive", true);
            this.resize()
            var swpp = this;
            d3.select(window).on('resize', function () {
                swpp.resize();
            });
            this.data = config.json;
            this.graph = this.preprocess(config);
            this.force
                .nodes(this.graph.nodes)
                .links(this.graph.links)

            // build the arrow.
            this.svg.append("svg:defs").selectAll("marker")
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
            this.path = this.svg.append("svg:g").selectAll("path")
                .data(this.force.links())
              .enter().append("svg:path")
            //    .attr("class", function(d) { return "link " + d.type; })
                .attr("class", "link")
                .attr("marker-end", "url(#end)");

            this.nodes = this.svg.selectAll(".node")
                .data(this.force.nodes(), function (d) {return d.id;})
              .enter().append("g")
                .attr("class", "node")
                .attr("cx", function (d) {return d.x;})
                .attr("cy", function (d) {return d.y;})
                .style("fill", function (d) {
                    return color(config.node_style_fill || d.group); 
                })
                .call(this.force.drag)

            this.nodes.append("circle")
                .attr("r", config.node_attr_r || 5);
            this.force
                .on("tick", this.tick())
                .start();
            this.postStart();
        }
        
        SWPPGraph.prototype.postStart = function () {};

        // Update point and edge positons
        SWPPGraph.prototype.tick = function (e) {
            var path = this.path;
            var nodes = this.nodes;
            var swpp = this;
            return function (e) {
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
            };
        }
        // Resize to fit window
        SWPPGraph.prototype.resize = function () {
            var width = window.innerWidth;
            var height = window.innerHeight;
            this.svg
              .attr("viewBox", "0 0 "+width+" "+height)
              .attr("width",  width)
              .attr("height", height);
            this.force.size([width,height]).resume();
            this.width = width;
            this.height = height;
        }
        //Virtual function: returns subset of data to be graphed
        SWPPGraph.prototype.preprocess = function (config) {
            var graph = {nodes:config.json.nodes, links:[], groups:config.json.groups};
            // Build links array
            config.json.links.forEach(function (e) {
                var sourceNode = config.json.nodes.find(function (n) {
                    return n.id === e.source;
                });
                var targetNode = config.json.nodes.find(function (n) {
                    return n.id === e.target;
                });
                graph.links.push({
                    source: sourceNode,
                    target: targetNode,
                    value: e.value
                });
            });
            return graph;
        }
        
        // Apply mixins to the singleton prototype
        if (mixin) {
            if (mixin.applyExtension) {
                mixin.applyExtension(SWPPGraph);
            }
        }
        
        return {
            getInstance: function (config) {
                if (!instance) {
                    instance = new SWPPGraph(config);
                }
                return instance;
            }
       };
    })(mixin);

    // Return the extended graph interface
    return {
        getInstance: ExtendedSWPP.getInstance
    };
})();
    
main();
