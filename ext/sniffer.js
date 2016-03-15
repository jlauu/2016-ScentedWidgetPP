// sniffer.js
// content script - adds callback functions from our background page to
// elements we are listening to.

function linkHandler (e) {
    var url = e.currentTarget.getAttribute("href")
    //alert ("Clicked on: " + url)
    chrome.runtime.sendMessage({href: url})
}

var container = document.getElementById("container");
container.style.backgroundColor = "lightblue";
console.log("Sniffer Loaded...");

links = $('a');
links.click(linkHandler);
