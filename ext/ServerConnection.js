// Server.js - module for connecting with the webapp server
var ServerConnection = (function () {
    var webhost = 'swpp-server-stage.herokuapp.com';

    // Sends logged data for one capture type to the server as a json
    function sendJSON (data, callback) {
        var xhr = new XMLHttpRequest();
        var json = JSON.stringify(data);
        var url = URI({protocol: "https", hostname: webhost, path: '/send'});
        xhr.open("POST", url.toString(), true);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                console.log(xhr.responseText);
            if (callback)
                callback();
            }
        }
        xhr.send(json);
    }

    function getClusters(request, callback) {
        var userid = request.userid;
        var name = request.name || null;
        var xhr = new XMLHttpRequest();
        var url = URI({protocol: 'https', hostname: webhost, query: "uid=" + userid});
        if (name) {
            url.addSearch("name",name);
        }
        xhr.open("GET", url.toString(), true);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                callback(JSON.parse(xhr.responseText));
            }
        }
        xhr.send();
    }

    return {
        webhost: webhost,
        sendJSON: sendJSON,
        getClusters: getClusters
    };
})();
