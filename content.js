// chrome.tabs.onActivated.addListener(function(activeInfo) {
//   // Fetch tab URL using activeInfo.tabId
//   chrome.tabs.get(activeInfo.tabId, function(tab) {
//     console.log("Current tab URL:", tab.url);

//     // List of supported services
//     const supportedServices = [
//       "https://www.dropbox.com/",
//       "https://2stable.com/"
//     ];

//     // Check if the current tab's URL is in the list of supported services
//     const isSupported = supportedServices.some(service => tab.url.includes(service));

//     // Determine the icon path based on support status
//     const iconPath = isSupported ? "gray" : "green";

//     // Update the extension icon
//     const iconDetails = {
//       "16": `images/${iconPath}-icon-16.png`,
//       "48": `images/${iconPath}-icon-48.png`,
//       "128": `images/${iconPath}-icon-128.png`
//     };
//     chrome.action.setIcon({ path: iconDetails });
//   });
// });
