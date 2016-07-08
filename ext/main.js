// main.js: top-level script that runs in background page
'use strict';

var session = Session.getInstance();
var clusters = ClusterManager.getInstance();
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(request.type);
    // Logs when user clicks a link
    if (request.type.includes(session.capture_message_name)) {
        var type = request.type.substr(session.capture_message_name.length);
        var e = request.event;
        var pass_exclusions = ['from', 'to', 'url'].every(function (url) {
                return !e['url'] || !e['url'].includes(session.webhost);
        });
        if (pass_exclusions) {
            session.capture(type, request.event);
        }
    // Handle queries to cluster manager
    } else if (request.type == clusters.query_message_name) {
        var results = clusters.getClustersByUrl(request.url);
        sendResponse({clusters: results});
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

// Save data to file before closing
chrome.windows.onRemoved.addListener(function (windowId) {
    session.unload();
});
