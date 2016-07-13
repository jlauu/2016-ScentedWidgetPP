function normalizeUrl(u, resolve_with) {
    var url;
    if (resolve_with) {
        url = URL.resolve(u, resolve_with);
    } else {
        url = URL(u);
    }
    return (url.host() || "") +
           (url.path() || "") +
           (url.queryString() || "");
}
