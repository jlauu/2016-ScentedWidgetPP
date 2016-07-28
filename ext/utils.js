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
        function traverse (t, f) {
            f(t); 
            if (t.children) {
                t.children.forEach(function (c) {
                    traverse(c,f)
                });
            }
        }
        var cm = ClusterManager.getInstance();
        function mkC (t) {
            cm.mkCluster(t.title);
            var urls = [];
            var kws = [];
            t.children.forEach(function (c) {
                urls.push(normalizeUrl(c.url));
                var tmp = c.title.replace(/\W/g, ' ').split(' ');
                kws = kws.concat(tmp.filter(function (k) {return k.length;}));
            });
            cm.addToCluster(t.title, urls, null, kws);
        }
        var flat_tree = [];
        traverse(tree, Array.prototype.push.bind(flat_tree));
        var leaf_folders = flat_tree.filter(function (t) {
            return t.children && t.children.every(function (c) {
                return !c.children;
            });
        });
        leaf_folders.forEach(mkC);
   });
}
