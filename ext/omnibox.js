//omnibox.js - event handlers for omnibox
(function () {
    var obx = chrome.omnibox;
    var clusterMgr = ClusterManager.getInstance();
    var sessionMgr = SessionManager.getInstance();
    
    function generateDescription(cluster) {
        var main = cluster.name;
        var kws = Array.from(cluster.keywords);
        var sub = kws.join(', ');
        return main + ' - <dim>' + sub + '</dim>';
    }

    function ClusterSuggest(cluster, cmd, description) {
        return {
            'content': cmd ? cmd + " " + cluster.name : cluster.name,
            'description': description || generateDescription(cluster)
        };
    }


    // Return a list of matched clusters
    obx.onInputChanged.addListener(function (text, suggest) {
        if (text == "") {
            obx.setDefaultSuggestion({
                description: "Search for clusters or use commands ALL, ADD, REMOVE"
            });
        } else if (text == 'ALL') {
            obx.setDefaultSuggestion({description: "View all clusters"});
            suggest([]);
        } else if (text.split(' ')[0] == 'ADD') {
            obx.setDefaultSuggestion({
                description: "Add current page to a cluster"
            });
            var results = clusterMgr.search(text.replace('ADD',''))
            results = results.map(function (c) {
                return ClusterSuggest(c, 'ADD', c.name);
            });
            suggest(results);
        } else if (text == 'REMOVE') {
            obx.setDefaultSuggestion({
                description: "Remove current page from its cluster"
            });
            var results = clusterMgr.getClusters().map(function (c) {
                return ClusterSuggest(c, 'REMOVE', c.name);
            });
            suggest(results);
        } else {
            obx.setDefaultSuggestion({
                description: "Search for clusters or use commands ALL, ADD, REMOVE"
            });
            var results = clusterMgr.search(text);
            suggest(results.map(function (r) {return ClusterSuggest(r);}));
        }
    });

    obx.onInputEntered.addListener(function (text, disposition) {
       var cmd = text.split(' ')[0];
       if (cmd == 'ALL') {
           chrome.windows.create({url: 'fullview.html'});
       } else if (cmd == 'ADD') {
           var cluster = text.match('^ADD \(.*\)')[1];
           chrome.tabs.getSelected(function (tab) {
               clusterMgr.addToCluster(cluster, [normalizeUrl(tab.url)]);
           });
           chrome.runtime.sendMessage({type: 'upload_cluster'});
       } else if (cmd == 'REMOVE') {
           chrome.tabs.getSelected(function (tab) {
               var url = normalizeUrl(tab.url);
               var cluster = clusterMgr.getClustersByUrl(url)[0];
               if (!cluster) return;
               clusterMgr.removeFromCluster(cluster.name, [url]);
               sessionMgr.unregisterTab(tab.id);
           });
           chrome.runtime.sendMessage({type: 'upload_cluster'});
       } else if (clusterMgr.has(text)) {
           chrome.windows.create({url: 'popup.html?cluster='+text}); 
       }
    });
})();
