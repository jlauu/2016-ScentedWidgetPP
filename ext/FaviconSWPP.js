var SWPP = (function (SWPP) {
    SWPP.favicon = true;
    var _preStart = SWPP.preStart;
    
    function getIconUrl (url) {
        return (new URL("http://www.google.com/s2/favicons?domain_url="+url)).toString();
    }

    SWPP.preStart = function (force, svg, nodes, links) {
        _preStart(force,svg,nodes,links);

        nodes.append("image")
            .attr("xlink:href", function (d) {
                return getIconUrl(d.url);
            })
            .attr("x", -6)
            .attr("y", -6)
            .attr("width",  "16px")
            .attr("height", "16px");
    };

    return SWPP;
})(SWPP || {});
