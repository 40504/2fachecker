chrome.tabs.onActivated.addListener(updateIconForCurrentTab);
chrome.webNavigation.onCompleted.addListener(updateIconForCurrentTab);

function updateIconForCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0];
    if (tab) {
      try {
        const currentTabUrl = new URL(tab.url);
        const currentFullHostname = extractFullHostname(currentTabUrl.hostname);

        console.log("Current tab URL:", tab.url);
        console.log("Extracted full hostname:", currentFullHostname);

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

            // Log all supported services for debugging
            console.log("Supported services:", supportedServices);

            // Check if the current full hostname ends with any in the supported services
            const matchedService = supportedServices.find(service => currentFullHostname.endsWith(service.host));

            console.log("Matched service:", matchedService);

            // Determine if the service is supported based on whether we found a match
            const isSupported = !!matchedService; // true if matchedService is not null

            console.log("Is supported:", isSupported);

            // Set the appropriate icon based on whether the service is supported
            const iconPath = isSupported ? "green" : "gray";

            console.log("Setting icon to:", iconPath);

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
  return hostname; // Return the full hostname if 'www.' is not present
}