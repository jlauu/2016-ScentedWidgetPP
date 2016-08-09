// main.js: top-level script that runs in background page
'use strict';
var app;
function init(userID) {
    // Browsing Event handlers
    // Logs user clicks and input interactions
    function logUserBrowsingInteractions (request) {
        // Log to Session
        var type = request.type.substr(sessionMgr.capture_message_name.length);
        var e = request.event;
        var pass_exclusions = ['from', 'to', 'url'].every(function (url) {
                return !e[url] || !e[url].includes(sessionMgr.webhost);
        });
        if (pass_exclusions) {
            sessionMgr.capture(type, request.event);
        }
    }

    // Returns an array of cluster JSONs
    function queryClusters (request, sendResponse) {
        if (request.url) {
            var results = clusterMgr.getClustersByUrl(request.url);
            results = results.map(function (c) {return c.toJSON();});
        } else if (request.name) {
            var results = [clusterMgr.get(request.name).toJSON()];
        } else if (request.combine) {
            var results = [clusterMgr.getCombined()];
        } else {
            var results = clusterMgr.getClusters();
            results = results.map(function (c) {return c.toJSON();});
        }
        if (results) {
            results.forEach(function (c) {
                c.children = clusterMgr.getChildren(c.name);
            });
            sendResponse({jsons: results}); 
        }
    }

    // Returns an array of cluster names
    function queryClusterNames (request, sendResponse) {
        var results = clusterMgr.getClusters();
        sendResponse({names: results.map(function(c) {return c.name;})});
    }

    // Requests a new cluster created
    function newCluster (request, sendResponse) {
        var c = clusterMgr.mkCluster(null, request.url);
        var json = c.toJSON();
        json.children = [];
        sendResponse({json: json});
    }

    // Updates a cluster
    function editCluster (request) {
        if (request.name) {
            if (request.edit_type == 'add') {
                clusterMgr.addToCluster(request.name, 
                                      request.nodes,
                                      request.links,
                                      request.keywords,
                                      request.children);
            } else if (request.edit_type == 'remove') {
                clusterMgr.removeFromCluster(request.name, 
                                      request.nodes,
                                      request.links,
                                      request.keywords,
                                      request.children);
            }
            if (request.new_name) {
                clusterMgr.editName(request.name, request.new_name);
                uploadClusters(request.new_name, function () {
                   downloadClusters({name: request.new_name, userid: userID});
                });
            }
        }
    }

    // Uploads all clusters if no name specified
    function uploadClusters (request, callback) {
        var names = request ? request.names : null;
        var cs = clusterMgr.getClusters();
        if (names) {
            cs = cs.filter(function (c) {return names.includes(c.name);});
        }
        var jsons = cs.filter(function (c) {
            return !c.name.includes(clusterMgr.UNNAMED_PREFIX);
        }).map(function (c) {
            var json = c.toJSON();
            json.userID = userID;
            return json;
        });
        var hjson = clusterMgr.getHierarchyJSON();
        ServerConnection.sendJSON({
            type: 'forest', 
            data: {data: hjson, userID: userID}
        }, function () {
            if (jsons) {
                ServerConnection.sendJSON({type: 'cluster', data: jsons}, callback);
            } else {
                callback();
            }
        });
    }

    function downloadClusters(request, callback) {
        // Initialize manager with clusters from server or localStorage
        ServerConnection.getClusters(request, function (data) {
            clusterMgr.loadHierarchyJSON(data.hierarchy);
            var cs = data.clusters;
            cs.forEach(function (j) {
                clusterMgr.loadJSON(j);
            });
            if (callback) callback();
        });
    }

    // Registers a tab or window to a cluster
    function registerTabWindows (request) {
        var tab = request.tab;
        var w = request.window;
        if (tab) sessionMgr.registerTab(tab, request.cluster_id);
        if (w) sessionMgr.registerWindow(w, request.cluster_id);
    }

    var sessionMgr = SessionManager.getInstance(userID);
    var clusterMgr = ClusterManager.getInstance();

    downloadClusters({userid: userID});

    // Upload sessionMgr logs when they reach capacity
    sessionMgr.addMaxLogListener(function (json) {
        ServerConnection.sendJSON(json);
        return true;
    });

    // Window/Tab Event Capturing Listeners
    chrome.tabs.onCreated.addListener(sessionMgr.registerTab);
    chrome.windows.onCreated.addListener(sessionMgr.registerWindow);

    // Message Passing function table
    var messageHandlers = {};
    //messageHandlers[sessionMgr.capture_message_name] = logUserBrowsingInteractions;
    messageHandlers[clusterMgr.query_message_name] = queryClusters;
    messageHandlers[clusterMgr.new_message_name] = newCluster;
    messageHandlers[clusterMgr.edit_message_name] = editCluster;
    messageHandlers[sessionMgr.register_message_name] = registerTabWindows;
    messageHandlers["upload_cluster"] = uploadClusters;
    messageHandlers["reload_cluster"] = downloadClusters;

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.type.includes(sessionMgr.capture_message_name)) {
            logUserBrowsingInteractions(request);
        } else if (messageHandlers[request.type]) {
            messageHandlers[request.type](request, sendResponse);
        }
    });

    // Logs only urls that enter browser history
    chrome.history.onVisited.addListener (function (historyItem) {
        if (historyItem.url.includes(ServerConnection.webhost)) return;
        // Closure to bind url to visit callback
        var processVisitsWithUrl = function (url) {
            return function (visits) {
                processVisit(url, visits[0]);
            };
        };
        chrome.history.getVisits({url: historyItem.url},processVisitsWithUrl(historyItem.url));
        // Modify browsing sessionMgr data
        var processVisit = function (url, visit) {
            var tabID, windowID, srcID, srcURL;
            srcURL = "";
            srcID = visit.refferingVisitId;
            if (!srcID) srcID = -1;
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
              sessionMgr.capture('pages', pv);
            });
        }
    });

    // Unregister closed tab/window
    chrome.windows.onRemoved.addListener(function (windowId) {
        sessionMgr.unregisterWindow(windowId);
    });

    chrome.tabs.onRemoved.addListener(function (tabId) {
        sessionMgr.unregisterTab(tabId);
    });

    // Update clusterMgr on tab update
    chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
        if (tab.url.includes("chrome://") ||
            tab.url.includes("chrome-extension://")) return;
        var url = normalizeUrl(tab.url);
        var cname = sessionMgr.clusterOfTab(tabId);
        cname = clusterMgr.has(cname) ? cname : null;
        sessionMgr.registerTab(tab, cname);
        // Try to find associated cluster
        var clusters = clusterMgr.getClustersByUrl(url);
        if (clusters.length && cname != clusters[0].name) {
            cname = clusters[0].name
        } else if (!cname && tab.openerTabId) {
            cname = sessionMgr.clusterOfTab(tab.openerTabId);
            cname = clusterMgr.has(cname) ? cname : null;
        }
        sessionMgr.registerTab(tab, cname);

        if (info.url && cname) {
            var last = sessionMgr.getLastLink();
            // Bad capture
            if (!last || last.from == last.to) {
                last = {from: tab.url, to: normalizeUrl(info.url)};
            }
            // New url is added as a link
            if (last && last.to == url) {
                var links = [{from: last.from, to: last.to}];
                clusterMgr.addToCluster(cname, [], links, []);
            // Add url as an individual node
            } else {
                clusterMgr.addToCluster(cname, [url], [], []);
            }
            sessionMgr.registerTab(tab, cname);
        }
    });

    // Save data to file before closing
    chrome.windows.onRemoved.addListener(function (windowId) {
        // Check if the last window is closing
        chrome.windows.getAll(function (ws) {
            if (ws.length <= 0) {
                var logs = sessionMgr.getAllLogJSON();
                logs.forEach(function (l) {
                    ServerConnection.sendJSON(l);
                });
                uploadClusters();
            }
        });
    });

    return {
        reload: function (cb) {downloadClusters({userid: userID},cb);},
        upload: function (cb) {uploadClusters({}, cb);}
    }
}

chrome.identity.getProfileUserInfo(function (info) {
    app = init(info.id);
});
