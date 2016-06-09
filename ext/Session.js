// session.js: manager of the a browsing session
'use strict';

function Session() {
    this.MAX_PAGEVISITS = 50;
    this.MAX_LINKCLICKS = 50;
    this.pageVisits = [];
    this.linksClicked = [];
    var session = this;
    chrome.identity.getProfileUserInfo(function (info) {
        session.userID = info.id;
    });
};

Session.prototype.addLinkHit = function (hit) {
    this.linksClicked.push(hit);
    if (this.linksClicked.length > this.MAX_LINKCLICKS) {
        this.sendJSON(this.linksClicked, 
                      'https://swpp-server-stage.herokuapp.com/sendLinks');
        this.linksClicked = [];
    }
}

// Given a PageVisit instance, add it to this session
Session.prototype.addVisit = function (pv) { 
    this.pageVisits.push(pv);
    if (this.pageVisits.length > this.MAX_PAGEVISITS) {
        this.sendJSON(this.pageVisits, 
                      'https://swpp-server-stage.herokuapp.com/sendVisits');
        this.pageVisits = [];
    }
};

// Send json to data server
Session.prototype.sendJSON = function (obj, url) {
    var xhr = new XMLHttpRequest();
    var data = JSON.stringify(obj);
    xhr.open("POST", url, true);
    xhr.open("POST", 'https://swpp-server-stage.herokuapp.com/send', true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            console.log(xhr.responseText);
        }
    }
    xhr.send(data);
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
