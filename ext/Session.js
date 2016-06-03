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
    console.log("unloading...");
    
    var data = new Blob([JSON.stringify(this.pageVisits)], 
                        {type : 'application/json'});
    var url = URL.createObjectURL(data);
    chrome.downloads.download({
       url: url,
       filename: this.appID + ".json",
       conflictAction: 'uniquify',
       saveAs: true
    });

    this.pageVisits = [];
}
