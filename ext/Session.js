// session.js: browsing session manager
'use strict';

function Session() {
    this.MAX_PAGEVISITS = 50;
    this.MAX_LINKCLICKS = 50;
    this.fails = 1;
    this.pageVisits = [];
    this.linksClicked = [];
    var session = this;
    chrome.identity.getProfileUserInfo(function (info) {
        session.userID = info.id;
    });
};

Session.prototype.addLinkHit = function (hit) {
    hit['userID'] = this.userid;
    this.linksClicked.push(hit);
    if (this.linksClicked.length > this.MAX_LINKCLICKS * this.fails) {
        var success = this.sendJSON(this.linksClicked, 
                      'https://swpp-server-stage.herokuapp.com/sendLinks');
        if (success) this.linksClicked = [];
    }
}

// Given a PageVisit instance, add it to this session
Session.prototype.addVisit = function (pv) { 
    this.pageVisits.push(pv);
    if (this.pageVisits.length > this.MAX_PAGEVISITS * this.fails) {
        var success = this.sendJSON(this.pageVisits, 
                      'https://swpp-server-stage.herokuapp.com/sendVisits');
        if (success) this.pageVisits = [];
    }
};

// Send json to data server
Session.prototype.sendJSON = function (obj, url) {
    var xhr = new XMLHttpRequest();
    var data = JSON.stringify(obj);
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            console.log(xhr.responseText);
            this.fails = 0;
        } else {
            this.fails += 1;
        }
    }
    xhr.send(data);
    return this.fails <= 1;
}

// dumps all data to server
Session.prototype.unload = function () {
    this.sendJSON(this.linksClicked, 
                  'https://swpp-server-stage.herokuapp.com/sendLinks');
    this.linksClicked = [];
    this.sendJSON(this.pageVisits, 
                  'https://swpp-server-stage.herokuapp.com/sendVisits');
    this.pageVisits = [];
}
