var SWPPUtils = (function () {
    var parser = document.createElement('a');
    function normalizeUrl(url) {
        parser.href = url;
        return parser.hostname + parser.pathname + parser.search;
    }
    return {
        normalizeUrl: normalizeUrl
    };
})();
