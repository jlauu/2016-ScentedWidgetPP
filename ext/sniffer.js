// sniffer.js
// content script - adds callback functions from our background page to
// elements we are listening to.

if (document.addEventListener) {
    document.addEventListener('click', onclick, false);
} else {
    document.attachEvent('onclick', onclick);
}

function onclick (e) {
    var e = window.e || e;
    if (e.target.tagName == 'A') {
        logLinkClicked(e);
    }
}

function logLinkClicked (e) {
    var from = document.URL;
    var to = e.target.getAttribute("href")
    var time = Date.now();
    // fixing relative paths
    if (to.indexOf('http') < 0) {
        if (to[0] == '/') {
            to = from + to.slice(1,to.length);
        }
        to = from + to;
    }
    chrome.runtime.sendMessage({type: "link-hit", 
                                hit: {'from':from, 'to':to, 'time':time}});
}
