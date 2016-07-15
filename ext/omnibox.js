//omnibox.js - event handlers for omnibox
(function () {
    var obx = chrome.omnibox;
    var clusterMgr = ClusterManager.getInstance();
    
    function generateDescription(cluster) {
        var main = cluster.name;
        var kws = Array.from(cluster.keywords);
        var sub = kws.join(', ');
        return main + ' - <dim>' + sub + '</dim>';
    }

    function ClusterSuggest(cluster) {
        return {
            'content': cluster.name,
            'description': generateDescription(cluster)
        };
    }

    obx.setDefaultSuggestion({
        description: "Search for clusters"
    });

    // Return a list of matched clusters
    obx.onInputChanged.addListener(function (text, suggest) {
        var results = clusterMgr.getClusters().map(ClusterSuggest);
        suggest(results);
    });
})();
