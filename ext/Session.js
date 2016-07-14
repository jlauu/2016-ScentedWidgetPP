// Session.js: manager of the a browsing session
'use strict';

// TODO: application-wide single-point-of-truth for types of items to be logged?
var Session = (function () {
    var instance;
    var INIT_MAX = 50;
    var userID;
    var webhost = 'swpp-server-stage.herokuapp.com';

    // Maintains a log and metadata for one type of event
    function Capture(type) {
        this.type = type;
        this.MAX = INIT_MAX;
        this.fails = 0;
        this.log = [];
    }

    function init() {
        //  private
        var CAPTURE_MSG_PREFIX = 'capture-';
        var REGISTER_MSG = 'register';
        var capture_types = ['links','pages','interactions'];
        var _captures = {};
        var max = 50;
        var id = -1;
        var tabClusters = new Map();
        var windowClusters = new Map();

        // public
        capture_types.forEach(function (type) {
            _captures[type] = new Capture(type);
        });
        function clearLogs () {
            for (var i in _captures) {
                _captures[i].log = [];
            }
        }

        // Logs an event
        function capture (type, e) {
            var c = _captures[type];
            e['userID'] = userID ? userID : "";
            c.log.push(e);
            if (c.log.length > c.MAX * (c.fails + 1)) {
                sendJSON(type, c.log);
                c.log = [];
            }
        }

        // Sends logged data for one capture type to the server as a json
        function sendJSON (type, data) {
            var xhr = new XMLHttpRequest();
            var json = JSON.stringify({'type':type, 'data':data});
            xhr.open("POST", 'https://' + webhost + '/send', true);
            xhr.setRequestHeader("Content-type", "application/json");
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    console.log(xhr.responseText);
                }
            }
            xhr.send(json);
        }

        // Sends all logged data to the server
        function unload () {
            Object.keys(_captures).forEach(function (k) {
               var c = _captures[k];
               if (c.log.length > 0) {
                   sendJSON(c.type, c.log);
                   c.log = [];
               }
            });
        }

        // Returns the most recent link capture
        function getLastLink() {
            var log = _captures['links'].log;
            return log[log.length-1];
        }

        // Returns the cluster id or null
        function clusterOfTab(tabId) {
            return tabClusters.get(tabId);
        }
        // Returns the cluster id or null
        function clusterOfWindow(window_id) {
            return windowClusters.get(window_id);
        }

        function registerTab(tab, clusterId) {
            if (clusterId) {
                tabClusters.set(tab.id, clusterId);
            } else if (tab.openerTabId && clusterOfTab(tab.openerTabId)) {
                tabClusters.set(tab.id, clusterOfTab(tab.openerTabId));
            } else if (clusterOfWindow(tab.windowId)) {
                tabClusters.set(tab.id, clusterOfWindow(tab.windowId));
            } else {
                tabClusters.set(tab.id, null);
            }
        }

        function registerWindow (w, clusterId) {   
            if (w.type && w.type != 'normal') return;
            if (clusterId) {
                windowClusters[w.id] = clusterId;
            } else {
                windowClusters[w.id] = null;
            }
        }

        function getRegistered(map) {
            var results = [];
            map.forEach(function (v,k) {
                results.push({id: k, cluster: v});
            });
            return results;
        }

        function unregister(map, id) {
            map.delete(id);
        }

        return {
            capture_message_name: CAPTURE_MSG_PREFIX,
            register_message_name: REGISTER_MSG,
            MAX_PAGEVISITS: max,
            MAX_LINKCLICKS: max,
            MAX_INTERACTIONS: max,
            webhost: webhost,
            getLastLink: getLastLink,
            registerWindow: registerWindow,   
            registerTab: registerTab,
            getRegisteredTabs: function () {
                return getRegistered(tabClusters);
            },
            getRegisteredWindows: function () {
                return getRegistered(windowClusters);
            },
            unregisterTab: function (id) {
                return unregister(tabClusters, id);
            },
            unregisterWindow: function (id) {
                return unregister(windowClusters, id);
            },
            clusterOfWindow: clusterOfWindow,
            clusterOfTab: clusterOfTab,
            unload: unload,
            clearLogs: clearLogs,
            capture: capture,
            sendJSON: sendJSON,
            userID: function (d) {return userID;}
        };
    }
    return {
        getInstance: function () {
            if (!instance) {
                instance = init();
                chrome.identity.getProfileUserInfo(function (info) {
                    userID = info.id;
                });
            }
            return instance;
        }
    };
})();
