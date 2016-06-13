// main.js: top-level script that runs in background page
'use strict';

var session = new Session();

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // Logs when user clicks a link
    if (request.type == "linkClick") {
        session.addLinkHit(request.event);
    } else if (request.type == "interaction") {
        session.addInteraction(request.event);
    }
});

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
          // fixing relative paths
          if (srcURL.indexOf('http') < 0) {
              srcURL = url + srcURL;
          }
          var pv = new PageVisit(visit.id, userID, tabID, windowID, srcID,
                                 srcURL, url, visit.visitTime, visit.transition);
          session.addVisit(pv);
        });
    }
});

// Save data to file before closing
chrome.windows.onRemoved.addListener(function (windowId) {
    session.unload();
});
