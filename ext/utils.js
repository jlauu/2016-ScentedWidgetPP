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
