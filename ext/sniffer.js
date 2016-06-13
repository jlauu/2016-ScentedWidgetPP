// sniffer.js
// content script - adds callback functions from our background page to
// elements we are listening to.

links = $('a');
links.click(function (e) {
    var from = document.URL;
    var to = e.currentTarget.getAttribute("href")
    var time = Date.now();
    // fixing relative paths
    if (to.indexOf('http') < 0)
        to = from + to
    chrome.runtime.sendMessage({type: "link-hit", 
                                hit: {'from':from, 'to':to, 'time':time}});
});
