// main.js: top-level script that runs in background page
'use strict';

var session = new Session();

// Logs only urls that enter browser history
chrome.history.onVisited.addListener (function (historyItem) {
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
       var tabID, windowID;
       chrome.tabs.query({url: url}, function (tabs) {
                                       if (tabs[0]) {
                                         tabID = tabs[0].id ? tabs[0].id : -1;
                                         windowID = tabs[0].windowId;
                                       }
       });
       var pv = new PageVisit(visit.id, session.appID, tabID, windowID, 
                              visit.refferingVisitId, url, visit.visitTime,
                              visit.transition);
       session.addVisit(pv);
    };
});

// Save data to file before closing
chrome.windows.onRemoved.addListener(function (windowId) {
    session.unload();
});
