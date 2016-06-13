// session.js: manager of the a browsing session
'use strict';

function Session() {
    this.init();
}

session.prototype.init = function () {
    this.MAX_PAGEVISITS = 50;
    this.MAX_LINKCLICKS = 50;
    this.MAX_INTERACTIONS = 50;
    this.clearLogs();
    chrome.identity.getProfileUserInfo.bind(this, function (info) {
        this.userID = info.id;
    });
}

session.prototype.clearLogs = function () {
    this.pageVisits = [];
    this.linksClicked = [];
    this.interactions = [];
    this._captures = {
       'link': {'type':'link','MAX': this.MAX_LINKCLICKS, 'fails':0, 'log': []},
       'pages': {'type':'pages', 'MAX': this.MAX_PAGEVISITS, 'fails':0, 'log': []},
        'interactions': {'type':'ineractions','MAX': this.MAX_INTERACTIONS, 'fails':0, 'log': []}
    };
}

session.prototype.capture(type, e) {
    var c = this._capture[type];
    e['userID'] = this.userID;
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
    xhr.open("POST", 'https://swpp-server-stage.herokuapp.com/send', true);
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
    Object.values(this._capture).forEach(function (c) {
       if (c.log.length > 0) {
           this.sendJSON(c.type, c.log);
           c.log = [];
       }
    });
}
