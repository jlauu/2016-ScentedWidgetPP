/* popup.js
 *
 */

document.addEventListener('DOMContentLoaded', function() {
    var background = chrome.extension.getBackgroundPage();
    var urlSequence = background.urlSequence;
    var list = document.getElementById("urls");
    for (var i in urlSequence) {
        var li = document.createElement("li");
        li.innerHTML = urlSequence[i].url;
        list.appendChild(li);
    }
});
