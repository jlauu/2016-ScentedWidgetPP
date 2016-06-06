// session.js: manager of the a browsing session
'use strict';

function Session() {
    this.MAX_PAGEVISITS = 10;
    // TODO: better id system
    this.appID = 1;
    // chrome.instanceID.getID(function (id) {instance.appID = id});
    // chrome.instanceID.getCreationTime(function (time) {instance.time = time});
    this.pageVisits = [];
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
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            console.log(xhr.responseText);
        }
    }
    xhr.send(data);
    this.pageVisits = [];
}
