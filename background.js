chrome.tabs.onActivated.addListener(updateIconForCurrentTab);
chrome.webNavigation.onCompleted.addListener(updateIconForCurrentTab);

function updateIconForCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0];
    if (tab) {
      try {
        const currentTabUrl = new URL(tab.url);
        const currentTLD = extractTLD(currentTabUrl.hostname);

        // Load the supported services from the JSON file
        fetch(chrome.runtime.getURL("domains.json"))
          .then(response => {
            if (!response.ok) {
              throw new Error(`Fetch failed with status ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            const supportedServices = data;
            const supportedTLDs = supportedServices.map(service => extractTLD(service.host));

            const isSupported = supportedTLDs.includes(currentTLD);
            const iconPath = isSupported ? "green" : "gray";

            chrome.action.setIcon({
              path: {
                "16": `images/${iconPath}-icon-16.png`,
                "48": `images/${iconPath}-icon-48.png`,
                "128": `images/${iconPath}-icon-128.png`
              }
            });
          })
          .catch(error => {
            console.error("Error fetching JSON data:", error);
          });
      } catch (error) {
        console.error("Invalid URL:", error);
      }
    }
  });
}

function extractTLD(hostname) {
  const parts = hostname.split(".");
  return parts.slice(-2).join(".");
}