var SWPP = (function (SWPP) {
    var _preStart = SWPP.preStart;
    var getScale = SWPP.getScaledForce;
    var zoom;
    var zoom_value = 20;
    var zoom_range = [0,1000];
    var base_ld, base_charge;

    function zoomed () {
        zoom_value = d3.event.scale;
        SWPP.resize();
    }

    SWPP.getScaledForce = function () {
        return getScale() * zoom_value;
    };

    SWPP.preStart = function (force, svg, nodes, links) {
        _preStart(force, svg, nodes, links);
        base_charge = force.charge();
        base_ld = force.linkDistance();
        zoom = d3.behavior.zoom()
            .scale(zoom_value)
            .scaleExtent(zoom_range)
            .on("zoom", zoomed);
        svg.call(zoom);
    };
    return SWPP;
})(SWPP);
