// Session.js: manager of the a browsing session
'use strict';

// TODO: application-wide single-point-of-truth for types of items to be logged?
var Session = (function (url) {
    var instance;
    var CAPTURE_MSG_PREFIX = 'capture-';
    var capture_types = ['links','pages','interactions']
    var INIT_MAX = 50;
    var _captures = {}

    // Maintains a log and metadata for one type of event
    function Capture(type) {
        this.type = type;
        this.MAX = INIT_MAX;
        this.fails = 0;
        this.log = [];
    }

    function init() {
        var max = 50
        var id = -1;
        capture_types.forEach(function (type) {
            _captures[type] = new Capture(type);
        });
        return {
            capture_message_name: CAPTURE_MSG_PREFIX,
            MAX_PAGEVISITS: max,
            MAX_LINKCLICKS: max,
            MAX_INTERACTIONS: max,
            webhost: url,
            userID: id,
            clearLogs: function () {
                Object.values(_captures).forEach(function (c) {
                    c.log = [];
                });
            },
            // Logs an event
            capture: function (type, e) {
                var c = _captures[type];
                e['userID'] = this.userID ? this.userID : "";
                c.log.push(e);
                if (c.log.length > c.MAX * (c.fails + 1)) {
                    this.sendJSON(type, c.log);
                    c.log = [];
                }
            },
            // Sends logged data for one capture type to the server as a json
            sendJSON: function (type, data) {
                var xhr = new XMLHttpRequest();
                var json = JSON.stringify({'type':type, 'data':data});
                xhr.open("POST", 'https' + this.webhost + '/send', true);
                xhr.setRequestHeader("Content-type", "application/json");
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4 && xhr.status == 200) {
                        console.log(xhr.responseText);
                    }
                }
                xhr.send(json);
            },
            // Sends all logged data to the server
            unload: function () {
                var send = this.sendJSON;
                Object.values(_captures).forEach(function (c) {
                   if (c.log.length > 0) {
                       send(c.type, c.log);
                       c.log = [];
                   }
                });
            }
        };
    }
    return {
        getInstance: function () {
            if (!instance) {
                instance = init();
                chrome.identity.getProfileUserInfo(function (info) {
                    instance.userID = info.id;
                });
            }
            return instance;
        }
    };
})('swpp-server-stage.herokuapp.com');
