// session.js: manager of the a browsing session
'use strict';

function Session() {
    this.init();
}

Session.prototype.init = function () {
    this.MAX_PAGEVISITS = 50;
    this.MAX_LINKCLICKS = 50;
    this.MAX_INTERACTIONS = 50;
    this.clearLogs();
    this.webhost = "swpp-server-stage.herokuapp.com";
    chrome.identity.getProfileUserInfo.call(this, info => this.userID = info.id);
}

Session.prototype.clearLogs = function () {
    this.pageVisits = [];
    this.linksClicked = [];
    this.interactions = [];
    this._captures = {
       'links': {'type':'links','MAX': this.MAX_LINKCLICKS, 'fails':0, 'log': []},
       'pages': {'type':'pages', 'MAX': this.MAX_PAGEVISITS, 'fails':0, 'log': []},
        'interactions': {'type':'interactions','MAX': this.MAX_INTERACTIONS, 'fails':0, 'log': []}
    };
}

Session.prototype.capture = function (type, e) {
    var c = this._captures[type];
    e['userID'] = this.userID ? this.userID : "";
    c.log.push(e);
    if (c.log.length > c.MAX * (c.fails + 1)) {
        this.sendJSON(type, c.log);
        c.log = [];
    }
}

// Send json to data server
Session.prototype.sendJSON = function (type, data) {
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
}

// dumps all data to server
Session.prototype.unload = function () {
    var send = this.sendJSON;
    Object.values(this._captures).forEach(function (c) {
       if (c.log.length > 0) {
           send(c.type, c.log);
           c.log = [];
       }
    });
}
