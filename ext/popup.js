/* popup.js
 *
 */

document.addEventListener('DOMContentLoaded', function() {
    var background = chrome.extension.getBackgroundPage();
    var session = background.session;
    var list = document.getElementById("urls");
    var urlSequence = session.pageVisits.forEach(function (pv) {
        var li = document.createElement("li");
        li.innerHTML = pv.url;
        list.appendChild(li);
    });
});
