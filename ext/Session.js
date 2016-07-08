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
        var tabClusters = {};
        var windowClusters = {};

        // public
        capture_types.forEach(function (type) {
            _captures[type] = new Capture(type);
        });
        function clearLogs () {
            Object.values(_captures).forEach(function (c) {
                c.log = [];
            });
        };

        // Logs an event
        function capture (type, e) {
            var c = _captures[type];
            e['userID'] = userID ? userID : "";
            c.log.push(e);
            if (c.log.length > c.MAX * (c.fails + 1)) {
                sendJSON(type, c.log);
                c.log = [];
            }
        };
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
        };
        // Sends all logged data to the server
        function unload () {
            var send = sendJSON;
            Object.keys(_captures).forEach(function (k) {
               var c = _captures[k];
               if (c.log.length > 0) {
                   send(c.type, c.log);
                   c.log = [];
               }
            });
        };
        function clusterOfTab(tab_id) {
            return tabClusters[tab_id];
        };
        function clusterOfWindow(window_id) {
            return windowClusters[window_id];
        };
        function registerTab(tab, cluster_id) {
            if (cluster_id) {
                tabClusters[tab.id] = cluster_id;
            } else if (tab.openerTabId && clusterOfTab(tab.openerTabId)) {
                tabClusters[tab.id] = clusterOfTab(tab.openerTabId);
            } else if (clusterOfWindow(tab.windowId)) {
                tabClusters[tab.id] = clusterOfWindow(tab.windowId);
            } else {
                tabClusters[tab.id] = null;
            }
        };
        function registerWindow (w, cluster_id) {   
            if (w.type && w.type != 'normal') return;
            if (cluster_id) {
                windowClusters[w.id] = cluster_id;
            } else {
                windowClusters[w.id] = null;
            }
        }

        return {
            capture_message_name: CAPTURE_MSG_PREFIX,
            register_message_name: REGISTER_MSG,
            MAX_PAGEVISITS: max,
            MAX_LINKCLICKS: max,
            MAX_INTERACTIONS: max,
            webhost: webhost,
            registerWindow: registerWindow,   
            registerTab: registerTab,
            clusterOfWindow: clusterOfWindow,
            unload: unload,
            clearLogs: clearLogs,
            capture: capture,
            sendJSON: sendJSON
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
