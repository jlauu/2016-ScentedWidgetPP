// MiniSWPP.js - Extends base graph with popup-specific layout/behavior
var SWPP = (function (SWPP, _d3) {
    // Extend with interaction
    var super_preStart = SWPP.preStart;
    var lasso;
    
    function lasso_start () {
        lasso.items()
            .classed({"not_possible":true,"selected":false})
        .selectAll("circle")
            .style("fill", null)
    }

    function lasso_draw () {
        lasso.items().filter(function (d) {return d.possible===true})
            .classed({"not_possible":true, "possible":false});

        lasso.items().filter(function (d) {return d.possible===false})
            .classed({"not_possible":false, "possible":true});
    }

    function lasso_end () {
        lasso.items().filter(function(d) {return d.selected==false;})
            .classed({"not_possible":false,"possible":false});
        SWPP.resetStyle();
        lasso.items().filter(function(d) {return d.selected===true;})
            .classed({"not_possible":false,"possible":false})
        .selectAll("circle")
            .style("fill", "red");
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
        })
        // Dispaly url
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
        if (_d3.lasso) {
            lasso = d3.lasso()
                        .items(nodes)
                        .hoverSelect(true)
                        .closePathDistance(75)
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
})(SWPP || {}, d3);
