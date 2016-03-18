urlSequence = [];

function addUrl(url) {
    urlSequence.push(url);
}

// Logs urls of web resources downloaded
chrome.webNavigation.onCompleted.addListener(function (details) {
    addUrl(details.url);
});

// Logs only links that content scripts modified
/*chrome.extension.onMessage.addListener(function (msg) {*/
/*        // Log anchor tag clicks*/
/*        if (msg.href) {*/
/*            console.log("log url: " + msg.href);*/
/*            addUrl(msg.href);*/
/*        }*/
/*});*/

// Log tab updates
/*chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {*/
/*    console.log("tab updated");*/
/*    if (changeInfo) {*/
/*        if (changeInfo.url) {*/
/*            console.log("log url: " + changeInfo.url);*/
/*            addUrl(changeInfo.url);*/
/*        }*/
/*    }*/
/*}*/

// Log tab creation
/*chrome.tabs.onCreated.addListener(function (tabId, changeInfo, tab) {*/
/*    console.log("tab created");*/
/*    if (changeInfo) {*/
/*        if (changeInfo.url) {*/
/*            console.log("log url: " + changeInfo.url);*/
/*            addUrl(changeInfo.url);*/
/*        }*/
/*    }*/
/*}*/
