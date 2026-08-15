// GitHub Pages has no server-side routing, so deep links to app routes
// (e.g. /dashboard) land on 404.html. Preserve the path and hand off to the SPA.
(function () {
  var path = window.location.pathname + window.location.search + window.location.hash;
  sessionStorage.setItem("mft:redirect-path", path);
  var scriptUrl = new URL(document.currentScript.src, window.location.href);
  var basePath = scriptUrl.pathname.replace(/spa-redirect-capture\.js$/, "");
  window.location.replace(basePath);
})();
