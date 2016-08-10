$(document).ready(function () {
    var url = normalizeUrl(document.URL);
    var cluster;
    function popup () {
        if (cluster != undefined)
            $.notify("You are in cluster: " + cluster, "info");
    }
    chrome.runtime.sendMessage({
        type: "cluster_query",
        url: url
    }, function (response) {
        if (response.jsons && response.jsons.length > 0) {
            cluster = response.jsons[0].name;
            window.addEventListener("focus", function () {
                popup();
            });
        }
    });
});
