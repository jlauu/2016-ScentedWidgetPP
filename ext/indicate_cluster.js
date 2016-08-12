$(document).ready(function () {
    var url = normalizeUrl(document.URL);
    var cluster;

    chrome.runtime.onMessage(function (request) {
        if (request.type == "indicator") {
            if (request.new_name) cluster = request.new_name;     
        }
    });

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
            if (!cluster.includes("_unnamed")) {
                popup();
                window.addEventListener("focus", function () {
                    popup();
                });
            }
        }
    });
});
