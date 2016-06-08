// session.js: manager of the a browsing session
'use strict';

function Session() {
    this.MAX_PAGEVISITS = 50;
    this.pageVisits = [];
    chrome.identity.getProfileUserInfo(function (info) {
        this.userID = info.id;
    });
};

// Given a PageVisit instance, add it to this session
Session.prototype.addVisit = function (pv) { 
    this.pageVisits.push(pv);
    if (this.pageVisits.length > this.MAX_PAGEVISITS) {
        this.unload();
    }
};

// Transfer page visits from temp storage to permanent site
Session.prototype.unload = function () {
    var xhr = new XMLHttpRequest();
    var data = JSON.stringify(this.pageVisits);
    xhr.open("POST", 'https://swpp-server-stage.herokuapp.com/send', true);
//    xhr.open("POST", 'http://localhost:5000/send', true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            console.log(xhr.responseText);
        }
    }
    xhr.send(data);
    this.pageVisits = [];
}
