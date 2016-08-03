function normalizeUrl(u, resolve_with) {
    var url;
    if (resolve_with) {
        url = URI(u, resolve_with);
    } else {
        url = URI(u);
    }
    url = url.normalize();
    return (url.hostname() || "") +
           (url.path() || "") +
           (url.search() || "");
}

function importBookmarks() {
   chrome.bookmarks.getTree(function (root) {
        var tree = root[0];
        function traverse (parent, t, f) {
            f(parent, t); 
            if (t.children) {
                t.children.forEach(function (c) {
                    traverse(t,c,f)
                });
            }
        }
        var cm = ClusterManager.getInstance();
        function mkC (parent, t) {
            if (t.children) {
                cm.mkCluster(t.title);
                var urls = [];
                var kws = [];
                t.children.forEach(function (c) {
                    if (c.url) {
                        urls.push(normalizeUrl(c.url));
                    }
                    var tmp = c.title.replace(/\W/g, ' ').split(' ');
                    kws = kws.concat(tmp.filter(function (k) {
                        return k.length;
                    }));
                });
                cm.addToCluster(t.title, urls, null, kws);
            }
        }

        function mkH(parent, t) {
            if (t.children && parent) {
                cm.setParent(t.title, parent.title);
            }
        }
        tree.children.forEach(function (t) {traverse(null, t, mkC);});
        app.upload(function () {
            // Get cluster with ids populated
            app.reload(function () {
                traverse(null, tree, mkH); 
                // Upload populated hierarchy
                app.upload();
            });
        });
   });
}
