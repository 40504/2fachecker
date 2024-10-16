chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  const currentTabUrl = new URL(tabs[0].url);

  // Extract the TLD from the current tab's URL
  const currentTLD = extractTLD(currentTabUrl.hostname);

  // Load the supported services from the JSON file
  fetch(chrome.runtime.getURL("domains.json"))
    .then(response => response.json())
    .then(data => {
      const supportedServices = data;

      // Find the service that matches the current tab's TLD
      const matchedService = supportedServices.find(service => extractTLD(service.host) === currentTLD);

      const status = document.getElementById('status');
      if (matchedService) {
        status.textContent = "Supported";
        displayServiceInfo(matchedService);
      } else {
        // status.textContent = "Not Supported";
        status.innerHTML = `Click to search on Google: <a href="https://www.google.com/search?q=https://${currentTLD}:+2fa" target="_blank">https://${currentTLD}: 2fa</a>`;

      }
    });
});

function displayServiceInfo(service) {
  const dataContainer = document.getElementById('data-container');
  dataContainer.innerHTML = "";

  for (const key in service) {
    const info = document.createElement('p');
    if (key === "doc" || key === "rec") {
      const docLink = document.createElement('a');
      docLink.href = service[key];
      docLink.textContent = `${service[key]}`;
      docLink.target = "_blank"; // Open the link in a new tab
      info.textContent = `${key}:`;
      dataContainer.appendChild(info);
      dataContainer.appendChild(docLink);
    } else {
      info.textContent = `${key}: ${service[key]}`;
      dataContainer.appendChild(info);
    }
  }
}

function extractTLD(hostname) {
  const parts = hostname.split(".");
  return parts.slice(-2).join(".");
}
