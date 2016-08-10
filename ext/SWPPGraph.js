'user strict';
//  SWPPGraph.js - Base force-layout graphical module
var SWPP = (function (window) {
    var module = {
        graph: null, // the processed graph json
        data: null, // the original data json
        config: null // the original data and other options
    },
    color = null,
    width = null,
    height = null,
    force = null,
    // Cached d3 selections
    links = null,
    nodes = null,
    svg = null;

    // Sets fields in links to actual node references
    function fixLinkReferences (config) {
        var links = [];
        config.json.links.forEach(function (e) {
            var sourceNode = config.json.nodes.find(function (n) {
                return n.id === e.source;
            });
            var targetNode = config.json.nodes.find(function (n) {
                return n.id === e.target;
            });
            if (sourceNode && targetNode) {
                links.push({
                    source: sourceNode,
                    target: targetNode,
                    value: e.value || 1
                });
            }
        });
        return links;
    }
    
    module.getWidth = function () {
        return svg.attr('width');
    };

    module.getHeight = function () {
        return svg.attr('height');
    };

    module.hasLink = function (n) {
        return module.graph.links.some(function (l) {
            return l.source === n || l.target === n;
        });
    }

    module.getScaledForce = function () {
        //var n = d3.selectAll('.node')[0].length;
        var s = force.size();
        var k = Math.sqrt(1 / (s[0] * s[1]));
        return k < 1 ? 1 : k;
    }

    function validCfg(prop, default_val) {
        return typeof prop === "number" ? prop : default_val;
    }

    // Start/initialize d3's force layout
    module.init = function (cfg) {
        module.config = cfg;
        var config = cfg;
        width = window.innerWidth,
        height = window.innerHeight,
        color = d3.scale.category20();
        force = d3.layout.force()
            .gravity(validCfg(config.gravity,.3))
            .linkDistance(validCfg(config.linkDistance,5))
            .linkStrength(validCfg(config.linkStrength,2))
            .size([width,height]);
        if (config.chargeDistance)
            force.chargeDistance(config.chargeDistance);
        svg = d3.select("div.svg-container").append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .classed("svg-content-responsive", true);
        d3.select(window).on('resize', function () {
            module.resize();
        });
        module.data = config.json;
        module.graph = module.preprocess(cfg || module.config);
        module.update();
    }

    module.update = function () {
        module.resize()
        var graph = module.graph;
        force
            .nodes(graph.nodes)
            .links(graph.links)
        // Set edge look and behavior
        links = svg.selectAll(".link")
            .data(force.links(), config.link_key || function (d) {
                return [d.source, d.target];
            });
        module.defineLinks(links);

        // Set node look and behavior
        nodes = svg.selectAll(".node")
            .data(force.nodes(), config.node_key || function (d) {
                return d.id;
            });
        module.defineNodes(nodes);

        function tick (e) {
            module.linkTick(e, links);
            module.nodeTick(e, nodes);
        }

        force
            .on("tick", tick)
        module.preStart(force, svg, nodes, links);
        force.start();
    }

    module.resetStyle = function () {
        nodes.selectAll("circle")
            .style("fill", function (d) {
                var f = module.config.node_style_fill;
                return color(f ? f(d) : d.group);
            })
            .attr("r", module.config.node_attr_r || 5)
    }

    module.defineNodes = function (nodes) {
          nodes.enter().append("g")
            .attr("class", "node")
            .append("circle")
            .style("fill", function (d) {
                var f = module.config.node_style_fill;
                return color(f ? f(d) : d.group);
            })
            .attr("r", module.config.node_attr_r || 5)
         nodes.exit()
            .each(function (d) {
                links.filter(function (l) {
                    return l.source === d || l.target === d;
                }).remove();
            }).remove();
    }

    // Draws edges with arrows - http://bl.ocks.org/d3noob/5141278
    module.defineLinks = function () {
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
        links = svg.append("svg:g").selectAll("path")
            .data(force.links())
          .enter().append("svg:path")
            .attr("class", function(d) { return "link " + d.type; })
            .attr("class", "link")
            .attr("marker-end", "url(#end)");
    };

    // Extendable virtual function
    module.preStart = function () {};

    // Update point and edge positons
    module.linkTick = function (e, links) {
        links.attr("d", function(d) {
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
    };

    module.nodeTick = function (e, nodes) {
        nodes.attr("transform", function (d, i) { 
            return ["translate(",d.x,",",d.y,")"].join(" ");
        });
    };
    // Resize to fit window
    module.resize = function () {
        width = window.innerWidth;
        height = window.innerHeight;
        svg
          .attr("viewBox", "0 0 "+width+" "+height)
          .attr("width",  width)
          .attr("height", height);
        // Readjust forces
        force.size([width,height]);
        var k = module.getScaledForce();
        var config = module.config;
        var ld = validCfg(config.linkDistance, 10 / k);
        var charge = validCfg(config.charge, -1);
        force.charge(charge + ld * -.5)
            //.charge(function (d) {
            //    return (module.hasLink(d) ? charge * ld *.2 : charge) / k;
            //})
            //.gravity((config.gravity || 0.3) * k)
            // TODO: scale links 
            //.linkDistance(config.linkDistance || 15)
            //.linkStrength(config.linkStrength || .2)
            .resume();
    };

    // Virtual function to modify or select a subset of the original graph
    module.preprocess = function (config) {
        var graph = {nodes:config.json.nodes, groups:config.json.groups};
        // Build links array
        graph.links = fixLinkReferences (config);
        return graph;
    }

    module.delete = function () {
        force.stop();
        d3.selectAll('svg *').remove();
    };
    
    return module;
})(window);
