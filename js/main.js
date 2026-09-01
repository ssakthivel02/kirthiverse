(async function initializeKirthiVerse() {
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Unable to load ${src}`));
      document.head.appendChild(script);
    });
  }

  await loadScript("js/config.js");
  await loadScript("js/api-client.js");

  try {
    const { body, requestId } = await window.AppApi.status();
    document.documentElement.dataset.apiStatus = body.status;
    document.documentElement.dataset.apiVersion = body.apiVersion;
    console.info("KirthiVerse API connected", {
      service: body.service,
      version: body.version,
      apiVersion: body.apiVersion,
      requestId,
    });
  } catch (error) {
    document.documentElement.dataset.apiStatus = "offline";
    console.error("KirthiVerse API connection failed", error);
  }

  window.dispatchEvent(
    new CustomEvent("app-api-ready", {
      detail: window.APP_CONFIG,
    }),
  );
})();
