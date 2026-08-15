// Restore the path captured by 404.html before React Router initializes.
(function () {
  var redirectPath = sessionStorage.getItem("mft:redirect-path");
  if (redirectPath) {
    sessionStorage.removeItem("mft:redirect-path");
    var currentPath = window.location.pathname + window.location.search + window.location.hash;
    if (redirectPath !== currentPath) {
      history.replaceState(null, "", redirectPath);
    }
  }
})();
