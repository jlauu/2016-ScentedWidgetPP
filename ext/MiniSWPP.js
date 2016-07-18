// MiniSWPP.js - Extends base graph with popup-specific layout/behavior
var SWPP = (function (SWPP) {
    // Extend with interaction
    SWPP.preStart = function (force, svg, nodes, links) {
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
                .text(d.url);
        })
        .on("mouseleave", function () {
            svg.selectAll('#url-text').remove();
        });

    };
    return SWPP;
})(SWPP || {});
