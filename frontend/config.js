(function initNovaCartConfig() {
  const STORAGE_KEY = "novacart_api_base_url";
  const params = new URLSearchParams(window.location.search);
  const configuredApi = normalizeUrl(params.get("api"));
  const storedApi = normalizeUrl(window.localStorage.getItem(STORAGE_KEY));
  const defaultApi = normalizeUrl(window.NOVACART_API_BASE_URL || "");

  if (configuredApi) {
    window.localStorage.setItem(STORAGE_KEY, configuredApi);
  }

  const apiBaseUrl =
    configuredApi ||
    storedApi ||
    defaultApi ||
    inferLocalApiBaseUrl();

  window.NOVACART_CONFIG = {
    API_BASE_URL: apiBaseUrl,
    ADMIN_URL: apiBaseUrl ? `${apiBaseUrl}/admin` : "",
  };

  function normalizeUrl(value) {
    return String(value || "").trim().replace(/\/$/, "");
  }

  function inferLocalApiBaseUrl() {
    if (!["localhost", "127.0.0.1"].includes(window.location.hostname)) {
      return "";
    }

    if (window.location.port === "5000") {
      return "";
    }

    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }
})();
