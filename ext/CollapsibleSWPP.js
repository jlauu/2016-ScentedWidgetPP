// CollapsibleSWPP - force layout configuration with collapsible nodes
var SWPP = (function (SWPP) {
    var _preprocess = SWPP.preprocess;
    var _preStart = SWPP.preStart;

    function click (d) {
        if (d.cluster_type) {
            expand(d);
        }
    }

    function expand (cluster) {
        //d3.selectAll('.node').filter(function (d) {
        //    return d.cluster_type && d.cluster === cluster.cluster;
        //}).remove();
        SWPP.graph.nodes = SWPP.graph.nodes.filter(function (d) {
            return !(d === cluster);
        });        
        cluster.graph.nodes.forEach(function (n) {
            n.cluster_type = false;
            n.cluster = cluster.name;
            SWPP.graph.nodes.push(n);
        });
        cluster.graph.links.forEach(function (l) {
            SWPP.graph.links.push(l);
        });
        d3.selectAll('#cluster-text').remove();
        SWPP.update();
    }

    SWPP.preprocess = function (config) {
        var graph = _preprocess(config);
        if (config.children.length <= 0) return graph;
        graph.nodes.forEach(function (d) {
            d.cluster_type = false;
        });
        config.children.forEach(function (c) {
            c.cluster_type = true;
            c.id = c.name;
            c.cluster = c.name;
        });
        graph.nodes = graph.nodes.concat(config.children);
        config.children = [];
        return graph;
    };

    SWPP.preStart = function (force, svg, nodes, links) {
        _preStart(force, svg, nodes, links);
        nodes.filter(function (d) {return d.cluster_type;})
            .on('dblclick', click)
            // Dispaly url
            .on("mouseover", function (d) {
                var text = svg.append("text")
                    .attr('id', 'cluster-text')
                    .attr('y', 15)
                    .attr('x', 15)
                    .attr('dy', '.35em')
                    .text(d.id);
            })
            .on("mouseleave", function () {
                svg.selectAll('#cluster-text').remove();
            });
    };

    return SWPP;
})(SWPP || {});
