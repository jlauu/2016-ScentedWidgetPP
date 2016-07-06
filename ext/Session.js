// session.js: manager of the a browsing session
'use strict';

var Session = (function (url) {
    var instance;
    var capture_types = ['links','pages','interactions']
    var INIT_MAX = 50;

    function mkCapture(type) {
        var c = {}
        c[type] = {'type': type, 'MAX': INIT_MAX, 'fails':0, 'log':[]};
        return c
    }

    function init() {
        var max = 50
        var id = -1;
        var _captures = {}
        capture_types.forEach(function (type) {
            _captures[type] = mkCapture(type);
        });
        return {
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
            capture: function (type, e) {
                var c = _captures[type];
                e['userID'] = this.userID ? this.userID : "";
                c.log.push(e);
                if (c.log.length > c.MAX * (c.fails + 1)) {
                    this.sendJSON(type, c.log);
                    c.log = [];
                }
            },
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
