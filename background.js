chrome.tabs.onActivated.addListener(updateIconForCurrentTab);
chrome.webNavigation.onCompleted.addListener(updateIconForCurrentTab);

function updateIconForCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0];
    if (tab) {
      try {
        const currentTabUrl = new URL(tab.url);
        const currentFullHostname = extractFullHostname(currentTabUrl.hostname);

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

            // Check if the current full hostname exactly matches any in the supported services
            const isSupported = supportedServices.some(service => service.host === currentFullHostname);

            // Set the appropriate icon based on whether the service is supported
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

// Function to extract the full hostname, removing 'www.' but keeping other subdomains
function extractFullHostname(hostname) {
  if (hostname.startsWith('www.')) {
    return hostname.substring(4); // Remove 'www.' from the hostname
  }
  return hostname;  // Return the full hostname if 'www.' is not present
}