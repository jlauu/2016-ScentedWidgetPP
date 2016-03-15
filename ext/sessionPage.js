urlSequence = [];

function addUrl(url) {
    urlSequence.push(url);
}

chrome.extension.onMessage.addListener(function (msg) {
        // Log anchor tag clicks
        if (msg.href) {
            console.log("log url: " + msg.href);
            addUrl(msg.href);
        }
});

/*chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {*/
/*    if (changeInfo) {*/
/*        if (changeInfo.url) {*/
/*            addUrl(changeInfo.url);*/
/*        }*/
/*    }*/
/*}*/
