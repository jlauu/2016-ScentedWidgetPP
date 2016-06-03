// PageVisit.js: A struct representing a single page visit event
"use strict";

function PageVisit(id, sessionID, windowID, tabID, srcID, url, time, transition) {
    this.id = id;
    this.sessionID = sessionID;
    this.tabID = tabID;
    this.windowID = windowID;
    this.srcID = srcID;
    this.url = url;
    this.time = time;
    this.transition = transition;
    //this.duration = duration;
};
