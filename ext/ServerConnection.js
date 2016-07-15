// Server.js - module for connecting with the webapp server
var ServerConnection = (function () {
    var webhost = 'swpp-server-stage.herokuapp.com';

    // Sends logged data for one capture type to the server as a json
    function sendJSON (data) {
        var xhr = new XMLHttpRequest();
        var json = JSON.stringify(data);
        var url = URI({protocol: "https", hostname: webhost, path: '/send'});
        xhr.open("POST", url.toString(), true);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                console.log(xhr.responseText);
            }
        }
        xhr.send(json);
    }

    function getClusters(userid, callback) {
        var xhr = new XMLHttpRequest();
        var url = URI({protocol: 'https', hostname: webhost, query: "uid=" + userid});
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
