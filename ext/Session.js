// session.js: manager of the a browsing session
'use strict';

function Session() {
    // TODO: better id system
    this.appID = 1;
    // chrome.instanceID.getID(function (id) {instance.appID = id});
    // chrome.instanceID.getCreationTime(function (time) {instance.time = time});
    this.pageVisits = [];
};

Session.prototype.addVisit = function (pv) { this.pageVisits.push(pv); };
