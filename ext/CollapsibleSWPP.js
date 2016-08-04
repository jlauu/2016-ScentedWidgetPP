// CollapsibleSWPP - force layout configuration with collapsible nodes
var SWPP = (function (SWPP) {
    var _preprocess = SWPP.preprocess;
    var _preStart = SWPP.preStart;
    var nameToCluster = new Map();

    function click (d) {
        if (d.cluster_type) {
            expand(nameToCluster.get(d.cluster_name));
        }
    }

    function expand (cluster) {
        cluster.graph.nodes.forEach(function (n) {
            SWPP.graph.nodes.push(n);
            n.cluster_name = cluster.name;
        });
        cluster.graph.links.forEach(function (l) {
            SWPP.links.push(l);
        });
        SWPP.graph.nodes.forEach(function (n) {
            if (!n.cluster_name) {
                n.cluster_name = config.name;
            }
        });
        SWPP.update();
    }

    SWPP.preprocess = function (config) {
        var graph = _preprocess(config);
        if (config.children.length <= 0) return graph;
        graph.nodes.forEach(function (d) {
            d.cluster_type = false;
        });
        config.children.forEach(function (c) {
            nameToCluster.set(c.name, c);
            graph.nodes.push({
                cluster_type: true,
                cluster_name: c.name,
                id: c.name
            });
        });
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
            
    }

    return SWPP;
})(SWPP || {});
