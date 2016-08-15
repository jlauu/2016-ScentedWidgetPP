// MiniSWPP.js - Extends base graph with popup-specific layout/behavior
var SWPP = (function (SWPP) {
    // Extend with interaction
    var super_preStart = SWPP.preStart;
    var lasso;
    
    function lasso_start () {
        lasso.items()
            .classed({"not_possible":true,"selected":false})
        if (SWPP.favicon) {
            d3.selectAll(".node image")
                .style("visibility", "hidden");
        }
    }

    function lasso_draw () {
        lasso.items().filter(function (d) {return d.possible===true})
            .classed({"not_possible":true, "possible":false});

        lasso.items().filter(function (d) {return d.possible===false})
            .classed({"not_possible":false, "possible":true});
    }

    function lasso_end () {
        var unselected = lasso.items().filter(function(d) {return d.selected==false;})
            .classed({"not_possible":false,"possible":false});
        SWPP.resetStyle();
        var selected = lasso.items().filter(function(d) {return d.selected===true;})
            .classed({"not_possible":false,"possible":false})
        .selectAll("circle")
            .style("fill", "red");
        if (SWPP.favicon) {
            unselected.selectAll("image")
                .style("visibility", "visible");
        }
    }

    SWPP.getScaledForce = function () {
        var n = SWPP.graph.nodes.length;
        var w = SWPP.getWidth();
        var h = SWPP.getHeight();
        return Math.sqrt(n / (w*h));
    };

    SWPP.preStart = function (force, svg, nodes, links) {
        super_preStart(force,svg,nodes,links);
        nodes
        // Go to url in current tab
        .on("dblclick", function (d) {
            chrome.tabs.update({url: "https://" + d.url});
            window.location = window.location;
        })
        // Display url
        .on("mouseover", function (d) {
            var text = svg.append("text")
                .attr('id', 'url-text')
                .attr('y', 15)
                .attr('x', 15)
                .attr('dy', '.35em')
                .text(d.url || d.name);
        })
        .on("mouseleave", function () {
            svg.selectAll('#url-text').remove();
        });

        // http://bl.ocks.org/skokenes/511c5b658c405ad68941
        if (d3.lasso) {
            lasso = d3.lasso()
                        .items(nodes)
                        .hoverSelect(true)
                        .closePathDistance(300)
                        .closePathSelect(true)
                        .area(svg)
                        .on("start", lasso_start)
                        .on("draw", lasso_draw)
                        .on("end", lasso_end);
            svg.call(lasso);
        }
        d3.select("body")
            .on("keydown", function () {
                if (d3.event.keyCode == 81) {
                    SWPP.resetStyle();
                }
            });
    };

    SWPP.getLassoSelection = function () {
        return lasso.items().filter(function (d) {
            return d.selected === true;
        });
    };
    return SWPP;
})(SWPP || {});
