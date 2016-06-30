'use strict';

function init() {
    chrome.storage.sync.get('swpp_graph', function (o) {
        if (o.swpp_graph) {
            SWPP.init(o.swpp_graph);
        } else {
            var xhr = new XMLHttpRequest();
            var userid = chrome.extension.getBackgroundPage().session.userID;
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    var json = JSON.parse(xhr.responseText);
                    console.log(json);
                    SWPP.init(json);
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

var SWPP = (function () {
    var swpp = {
        width: window.innerWidth,
        height: window.innerHeight,
        svg: null,
        data: null,
        links: [],
        nodes: [],
        hover: {},
        selected: null, // cluster id
        force: null,
        foci: [],
        focus_tick: null,
        theta: null,
        reset_foci: null,
        ring_clusters: [],
        dispatch: null,
        selected_nodes: []
    };
    var cluster_representatives = {};
    
    var init_focus_tick = function () {
        swpp.setRingFocus();
        swpp.reset_foci = swpp.setRingFocus;
        return ring_foci_tick;
    };

    swpp.selectCluster = function (id) {
        swpp.selected = id;
        swpp.dispatch.select(id);
    };

    swpp.ring_shift_left = function () {
        swpp.force.alpha(.2);
        if (swpp.selected == 0 || swpp.selected) {
            swpp.ring_clusters.push(swpp.selected);
            swpp.foci.push({x:swpp.width/2, y:swpp.height/2});
        }
        swpp.selectCluster(swpp.ring_clusters.shift());
        swpp.foci.shift();
    };

    swpp.ring_shift_right = function () {
        swpp.force.alpha(.2);
        if (swpp.selected == 0 || swpp.selected) {
            swpp.ring_clusters = [swpp.selected].concat(swpp.ring_clusters);
            swpp.foci = [{x:swpp.width/2, y:swpp.height/2}].concat(swpp.foci);
        }
        swpp.selectCluster(swpp.ring_clusters.pop());
        swpp.foci.pop();
    };

    swpp.setRingFocus = function () {
        if (swpp.data) {
            swpp.foci = [];
            swpp.ring_clusters = [];
            var i = 0;
            swpp.data.groups.forEach(function (g_id) {
                swpp.ring_clusters.push(g_id);
                swpp.foci.push({x:0, y:0});
            });
            swpp.focus_tick = ring_foci_tick;
            swpp.force.linkDistance(function (d) {
                if (swpp.selected) {
                    var s_id = swpp.selected.__data__.group;
                    console.log(s_id);
                    if (s_id == d.source.group || s_id == d.target.group) {
                        return 50;
                    }
                }
                return 15;
            });
            swpp.force.start();
        }
    };

    function ring_foci_tick (theta) {
        var r = Math.min(swpp.width, swpp.height) / 3;
        if (theta) {
            swpp.theta = theta;
        } else if (!swpp.theta) {
            swpp.theta = 0;
        }
        var theta = swpp.theta;
/*        theta += Math.log(swpp.foci.length) / 2500;*/
        var offset = 2 * Math.PI / (swpp.foci.length);
        var a = 2 * Math.log(swpp.foci.length);
        for (var i in swpp.foci) {
            swpp.foci[i] = {
                'x': a * Math.cos(theta + i*offset - Math.PI/2) * r + swpp.width/2,
                'y': 1.2 * Math.sin(theta + i*offset - Math.PI/2) * r + swpp.height*1.3
            }
        }
        swpp.theta = theta;
    }

    function resize() {
        swpp.width = window.innerWidth;
        swpp.height = window.innerHeight;
        swpp.svg
            .attr("viewBox", "0 0 "+swpp.width+" "+swpp.height)
            .attr("width", swpp.width)
            .attr("height", swpp.width);
        swpp.force.size([swpp.width,swpp.height]).resume();
    }

    swpp.init = function (json) {
        var width = swpp.width,
            height = swpp.height;

        var force = d3.layout.force()
            .charge(-120)
            .gravity(0)
            .linkDistance(30)
            .linkStrength(.2)
            .friction(.85)
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
        var graph = json;
        swpp.nodes = graph.nodes;

        // Initialize links
        graph.links.forEach(function (e) {
            var sourceNode = graph.nodes.find(function (n) {
                return n.id === e.source;
            });
            var targetNode = graph.nodes.find(function (n) {
                return n.id === e.target;
            });
            swpp.links.push({
                source: sourceNode,
                target: targetNode,
                value: e.value
            });
        });
        force
            .nodes(swpp.nodes)
            .links(swpp.links)
            .on("tick", tick)

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
            .attr("d", "M0,-5L10,0L0,5");

        // add the links and the arrows
        var path = svg.append("svg:g").selectAll("path")
            .data(force.links())
          .enter().append("svg:path")
        //    .attr("class", function(d) { return "link " + d.type; })
            .attr("class", "link")
            .attr("marker-end", "url(#end)");

        // define nodes and data bindings
        var nodes = svg.selectAll(".node")
            .data(force.nodes(), function (d) {return d.id;})
          .enter().append("g")
            .attr("class", "node")
            .attr("cx", function (d) {return d.x;})
            .attr("cy", function (d) {return d.y;})
            .style("fill", function (d) {return color(d.group); })
            .call(force.drag)
            .on("dblclick", function (d) {
                var win = window.open(d.url, '_blank');
                win.focus();
            });
        
        // reference to cluster representative
        nodes.data().map(function (d,i) {
            if (cluster_representatives[d.group]) {
                d.rep = false;
            } else {
                d.rep = true;
                cluster_representatives[d.group] = d;
            }
            d.y = swpp.height * 1.2;
        });

        // add the nodes
        nodes.append("circle")
            .attr("r", 5);

        swpp.focus_tick = init_focus_tick();
        // DEFINE ticks
        function tick(e) {
            swpp.focus_tick(0);
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
                var focus, k;
                if (d.rep) {
                    var index = swpp.ring_clusters.indexOf(d.group);
                    if (index > -1) {
                        focus = swpp.foci[index];
                    // default to center
                    } else {
                        focus = {x: swpp.width/2, y: swpp.height/2};
                    }
                    k = e.alpha * 1.5;
                } else {
                    var rep = cluster_representatives[d.group];
                    focus = {x:rep.x, y:rep.y};
                    k = e.alpha * .2;
                }
                var x = d.x - focus.x,
                    y = d.y - focus.y,
                    l = Math.sqrt(x*x + y*y);
                if (l > 1) {
                    l = l / l * k;
                    d.x -= x *= l;
                    d.y -= y *= l;
                }
                return ["translate(",d.x,",",d.y,")"].join(" ");
            });
        }

        // Hovering effects
        d3.selectAll(".node")
          .on("mouseover", function (d) {
             var text = d3.select(this).append("text")
                .attr('id', 'node' + d.id.toString())
                .attr("x", 12)
                .attr("dy", ".35em")
                .text(function (d) {
                    var t = document.createElement('a');
                    t.href = d.url;
                    t = t.hostname + t.pathname;
                    t = t.split('www.')
                    t = t.length > 1 ? t[1] : t[0];
                    return t;
             });
          })
          .on("mouseleave", function (d) {
             var node = d3.select(this)
             node.classed('hover', false);
             d3.selectAll('text#node'+d.id.toString()).remove();
          });

        // Cluster Selected Events
        swpp.dispatch = d3.dispatch('select');
        swpp.dispatch.on('select', function (g_id) {
            var urlbox = d3.select("#urlbox");
            var nodes = d3.selectAll('.node')
                .filter(function (d) {return d.group == g_id;});
            urlbox.selectAll("li").remove()
            console.log(nodes);
            nodes.each(function (n) {
                urlbox.select("ul").append("li")
                    .text(n.url);
            });
        });

        // Key Events
        d3.select("body")
            .on('keydown', function () {
                if (d3.event.keyCode == 37) { // left
                    swpp.ring_shift_left();
                } else if (d3.event.keyCode == 39) { // right
                    swpp.ring_shift_right();
                }
            });
    };
    return swpp;
}());

init();
