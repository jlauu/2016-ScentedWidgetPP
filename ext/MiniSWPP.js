var MiniSWPP = (function () {
    // Extend with interaction
    var mixin = (function () {
        function extension(SWPP) {
            SWPP.prototype.postStart = function () {
                var swpp = this;
                this.nodes
                // Go to url in current tab
                .on("dblclick", function (d) {
                    chrome.tabs.update({url: "https://" + d.url});
                })
                // Dispaly url
                .on("mouseover", function (d) {
                    var text = swpp.svg.append("text")
                        .attr('id', 'url-text')
                        .attr('y', 15)
                        .attr('x', 15)
                        .attr('dy', '.35em')
                        .text(d.url);
                })
                .on("mouseleave", function () {
                    swpp.svg.selectAll('#url-text').remove();
                });

            }
        }

        return {
            applyExtension: extension
        };
    })();

    // Base graph interface
    var SWPP = (function (mixin) {
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
    })(mixin || {});

    // Return the extended graph interface
    return {
        getInstance: SWPP.getInstance
    };
})();
