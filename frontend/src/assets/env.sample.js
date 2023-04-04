(function (window) {
  window['env'] = window['env'] || {};

  // Environment variables
  window['env']['frontendBaseUrl'] = '${FRONTEND_BASE_URL}';
  window['env']['backendBaseUrl'] = '${BACKEND_BASE_URL}';
})(this);
