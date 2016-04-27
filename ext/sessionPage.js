urlSequence = [];

// TODO: Graph implementation incomplete
graph = {
    nodes: new Set(),
    edges: {},
    addNode: function (url) {
        this.nodes.add(url);
        this.edges[url] = new Set();
    },
    addEdge: function (from, to) {
        try {
            this.edges[from].add(to);
        } catch (e) {/*suppressing TypeError*/}
    },
    hasNode: function (url) {
        return this.nodes.has(url);
    }
};

function addUrl(url) {
    urlSequence.push(url);
}

// Logs only urls that enter browser history
chrome.history.onVisited.addListener (function (historyItem) {
    // Makes closure to bind url to visit callback
    var processVisitsWithUrl = function (url) {
        return function (visits) {
            processVisits(url, visits);
        };
    };
    chrome.history.getVisits({url : historyItem.url}, 
                             processVisitsWithUrl(historyItem.url));
    // Callback for history.getVisits()
    // updates the navigation data structure with a recent visit
    var processVisits = function (url, visits) {
        urlSequence.push({url: url, 
                          transition: visits[0].transition,
                          time: visits[0].visitTime});

        // TODO: Graph implementation incomplete
        graph.addNode(url);
        if (visits[0].transition == "link") {
            last_visit = urlSequence[urlSequence.length - 2].url;
            graph.addEdge(last_visit, url);
        }
    };
})

// Logs urls of web resources downloaded
/*chrome.webNavigation.onCompleted.addListener(function (details) {*/
/*    addUrl(details.url);*/
/*});*/

// Logs only links that content scripts modified
/*chrome.extension.onMessage.addListener(function (msg) {*/
/*        // Log anchor tag clicks*/
/*        if (msg.href) {*/
/*            console.log("log url: " + msg.href);*/
/*            addUrl(msg.href);*/
/*        }*/
/*});*/

// Log tab updates
/*chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {*/
/*    console.log("tab updated");*/
/*    if (changeInfo) {*/
/*        if (changeInfo.url) {*/
/*            console.log("log url: " + changeInfo.url);*/
/*            addUrl(changeInfo.url);*/
/*        }*/
/*    }*/
/*}*/

// Log tab creation
/*chrome.tabs.onCreated.addListener(function (tabId, changeInfo, tab) {*/
/*    console.log("tab created");*/
/*    if (changeInfo) {*/
/*        if (changeInfo.url) {*/
/*            console.log("log url: " + changeInfo.url);*/
/*            addUrl(changeInfo.url);*/
/*        }*/
/*    }*/
/*}*/
