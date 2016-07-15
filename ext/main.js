// main.js: top-level script that runs in background page
'use strict';

var session = SessionManager.getInstance();
var clusters = ClusterManager.getInstance();

// Upload session logs when they reach capacity
session.addMaxLogListener(function (json) {
    ServerConnection.sendJSON(json);
    return true;
});

// Browsing Event handlers

// Logs user clicks and input interactions
function logUserBrowsingInteractions (request) {
    // Log to Session
    var type = request.type.substr(session.capture_message_name.length);
    var e = request.event;
    var pass_exclusions = ['from', 'to', 'url'].every(function (url) {
            return !e['url'] || !e['url'].includes(session.webhost);
    });
    if (pass_exclusions) {
        session.capture(type, request.event);
    }


}

// Handle queries to cluster manager
function queryClusters (request, sendResponse) {
    var results = clusters.getClustersByUrl(request.url);
    results.map(function (c) {return c.toJSON();});
    sendResponse({jsons: results});
}

// Requests a new cluster created
function newCluster (request, sendResponse) {
    var c = clusters.mkCluster(null, request.url);
    var json = c.toJSON();
    sendResponse({json: json});
}

// Updates a cluster
function editCluster (request) {
    if (request.name) {
        if (request.edit_type == 'add') {
            clusters.addToCluster(request.name, 
                                  request.nodes || [],
                                  request.links || [],
                                  request.keywords || []);
        } else if (request.new_name) {
            clusters.editName(request.name, request.new_name);
        }
    }
}

// Upload clusters. Uploads all if no name specified
function uploadClusters (request) {
    var names = request ? request.names : null;
    var cs = clusters.getClusters();
    if (names) {
        cs = cs.filter(function (c) {return names.includes(c.name);});
    }
    var jsons = cs.filter(function (c) {
        return !c.name.includes(clusters.UNNAMED_PREFIX);
    }).map(function (c) {
        var json = c.toJSON();
        json.userID = session.userID();
        return json;
    });
    if (jsons) 
        ServerConnection.sendJSON({type: 'cluster', data: jsons});
}

// Registers a tab or window to a cluster
function registerTabWindows (request) {
    var tab = request.tab;
    var w = request.window;
    if (tab) session.registerTab(tab, request.cluster_id);
    if (w) session.registerWindow(w, request.cluster_id);
}

// Window/Tab Event Capturing Listeners
chrome.tabs.onCreated.addListener(session.registerTab);
chrome.windows.onCreated.addListener(session.registerWindow);

// Message Passing function table
var messageHandlers = {};
//messageHandlers[session.capture_message_name] = logUserBrowsingInteractions;
messageHandlers[clusters.query_message_name] = queryClusters;
messageHandlers[clusters.new_message_name] = newCluster;
messageHandlers[clusters.edit_message_name] = editCluster;
messageHandlers[session.register_message_name] = registerTabWindows;
messageHandlers["upload_cluster"] = uploadClusters;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type.includes(session.capture_message_name)) {
        logUserBrowsingInteractions(request);
    } else if (messageHandlers[request.type]) {
        messageHandlers[request.type](request, sendResponse);
    }
});

// Logs only urls that enter browser history
chrome.history.onVisited.addListener (function (historyItem) {
    if (historyItem.url.includes(session.webhost)) return;
    // Closure to bind url to visit callback
    var processVisitsWithUrl = function (url) {
        return function (visits) {
            processVisit(url, visits[0]);
        };
    };
    chrome.history.getVisits({url: historyItem.url}, 
            processVisitsWithUrl(historyItem.url));
    // Modify browsing session data
    var processVisit = function (url, visit) {
        var tabID, windowID, srcID, userID, srcURL;
        srcURL = "";
        srcID = visit.refferingVisitId;
        if (!srcID) srcID = -1;
        if (!session.userID) {
            userID = "-1";
        } else {
            userID = session.userID;
        }
        // capture the tab and window ids if they are still open
        chrome.tabs.query({url: url}, function (tabs) {
          if (tabs.length < 1) {
              tabID = -1;
              windowID = -1;
          } else {
              // finds the tab that provides the most information
              var tab = tabs.find(t => !!t.id);
              if (!tab) {
                  tabID = -1;
                  windowID = tabs[0].windowId;
                  // finding referrer through tab
                  if (!visit.refferingVisitId) {
                    chrome.tabs.executeScript
                        .bind(undefined, {"code":"return document.referrer"})
                        .call(undefined, rs => srcURL = rs[0] ? rs[0] : srcURL);
                  } 
              } else {
                  tabID = tab.id;
                  windowID = tab.windowId;
              }
          }
          // TODO: ensure absolute paths only
          var pv = new PageVisit(visit.id, userID, tabID, windowID, srcID,
                                 srcURL, url, visit.visitTime, visit.transition);
          session.capture('pages', pv);
        });
    }
});

// Unregister closed tab/window
chrome.windows.onRemoved.addListener(function (windowId) {
    session.unregisterWindow(windowId);
});

chrome.tabs.onRemoved.addListener(function (tabId) {
    session.unregisterTab(tabId);
});

// Update clusters on tab update
chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
    var cluster = session.clusterOfTab(tabId);
    if (cluster && info.url) {
        var url = normalizeUrl(info.url);
        if (url.includes('chrome://')) return;
        // Check if we can make an edge based on last logged link
        var last = session.getLastLink();
        if (last && last.to == url) {
            var links = [{from: last.from, to: last.to}];
            clusters.addToCluster(cluster, [], links, []);
        } else {
            clusters.addToCluster(cluster, [url], [], []);
        }
    }
});

// Save data to file before closing
chrome.windows.onRemoved.addListener(function (windowId) {
    var logs = session.getAllLogJSON();
    logs.forEach(function (l) {
        ServerConnection.sendJSON(l);
    });
    uploadClusters();
});
