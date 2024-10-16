chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  const currentTabUrl = new URL(tabs[0].url);
  const currentTLD = extractTLD(currentTabUrl.hostname);

  // Load the supported services from the JSON file
  fetch(chrome.runtime.getURL("domains.json"))
    .then(response => response.json())
    .then(data => {
      const supportedServices = data;

      // Find the service that matches the current tab's TLD
      const matchedService = supportedServices.find(service => extractTLD(service.host) === currentTLD);

      const popupContent = document.getElementById('popup-content');
      popupContent.innerHTML = ""; // Clear previous content

      if (matchedService) {
        // Create Service Header (Service Name and Icon)
        const serviceHeader = document.createElement('div');
        serviceHeader.className = 'service-header';

        const serviceImage = document.createElement('img');
        serviceImage.alt = `${matchedService.name} icon`; // Alt text for accessibility
        serviceImage.style.width = '32px'; // Optional: Set default image size
        serviceImage.style.height = '32px'; // Optional: Set default image size

        // Fetch the service icon (try 256px, fallback to 64px)
        fetchServiceIcon(matchedService.host, serviceImage);

        serviceHeader.appendChild(serviceImage);

        const serviceTitle = document.createElement('h5');
        serviceTitle.textContent = matchedService.name || currentTLD;
        serviceHeader.appendChild(serviceTitle);

        popupContent.appendChild(serviceHeader);

        // Dynamic Supported Methods Section (if TOTP or U2F exists)
        let supportedMethods = [];
        if (matchedService.hasTotp) supportedMethods.push('TOTP');
        if (matchedService.hasU2f) supportedMethods.push('U2F');
        
        if (supportedMethods.length > 0) {
          createDataSection('Supported 2FA methods:', supportedMethods.join(', '), popupContent, false, true);
        }

        // Home Page Section (if applicable)
        if (matchedService.host) {
          createDataSection('Domain:', matchedService.host, popupContent, true);
        }
        
        // "Where to Set Up" Section
        createDataSection('Where to set up:', matchedService.doc, popupContent, true);

        // "Where to Recover" Section (if applicable)
        if (matchedService.rec) {
          createDataSection('Where to recover:', matchedService.rec, popupContent, true);
        }

        // Notes Section (if applicable)
        if (matchedService.notes) {
          createDataSection('Notes', matchedService.notes, popupContent);
        }
      } else {
        popupContent.innerHTML = `Click to search on Google: <a href="https://www.google.com/search?q=https://${currentTLD}:+2fa" target="_blank">https://${currentTLD}: 2fa</a>`;
      }
    });
});

// Function to fetch the service icon (try 256px, fallback to 64px)
function fetchServiceIcon(host, imgElement) {
  // First try 256px favicon
  const googleFaviconUrl256 = `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${host}&size=256`;

  fetch(googleFaviconUrl256)
    .then(response => {
      if (response.ok) {
        imgElement.src = googleFaviconUrl256;
      } else {
        // Fallback to 64px favicon
        const googleFaviconFallback = `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
        imgElement.src = googleFaviconFallback;
      }
    })
    .catch(() => {
      // Final fallback to 64px favicon
      const googleFaviconFallback = `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
      imgElement.src = googleFaviconFallback;
    });
}

// Function to create badges with the appropriate Bootstrap styling
function createBadge(text) {
  const badge = document.createElement('span');
  badge.className = 'badge bg-success-subtle text-success-emphasis rounded-pill me-2';
  badge.textContent = text;
  return badge;
}

// Function to create a section with a title and content, can also include badges for supported methods
function createDataSection(title, content, container, isLink = false, isBadge = false) {
  const section = document.createElement('div');
  section.className = 'data-section mb-2 border rounded-1 p-2 bg-white';

  const sectionTitle = document.createElement('h6');
  sectionTitle.textContent = title;
  section.appendChild(sectionTitle);

  if (isBadge) {
    const contentArray = content.split(', ');
    contentArray.forEach(method => {
      const badge = createBadge(method);
      section.appendChild(badge);
    });
  } else if (isLink) {
    // For the Domain, Documentation, and Recovery fields that should be clickable
    const link = document.createElement('a');
    link.href = content.startsWith('http') ? content : `https://${content}`; // Ensure the link starts with http/https
    link.target = '_blank';
    link.textContent = content;
    section.appendChild(link);
  } else {
    const paragraph = document.createElement('p');
    paragraph.textContent = content;
    section.appendChild(paragraph);
  }

  container.appendChild(section);
}

// Function to extract the top-level domain (TLD) from a hostname
function extractTLD(hostname) {
  const parts = hostname.split(".");
  return parts.slice(-2).join(".");
}