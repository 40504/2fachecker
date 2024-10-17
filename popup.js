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
        serviceHeader.className = 'd-flex flex-column align-items-center mb-3';

        const serviceImage = document.createElement('img');
        serviceImage.alt = `${matchedService.name} icon`; // Alt text for accessibility
        serviceImage.style.width = '48px'; // Optional: Set default image size
        serviceImage.style.height = '48px'; // Optional: Set default image size
        serviceImage.className = 'rounded-3 mb-3';

        // Fetch the service icon (try 256px, fallback to 64px)
        fetchServiceIcon(matchedService.host, serviceImage);

        serviceHeader.appendChild(serviceImage);

        const serviceTitle = document.createElement('h5');
        serviceTitle.textContent = matchedService.name || currentTLD;
        serviceTitle.className = 'fw-bold mb-0';
        serviceHeader.appendChild(serviceTitle);

        const serviceDomain = document.createElement('a');
        serviceDomain.className = 'small text-decoration-none';
        serviceDomain.href = 'https://' + matchedService.host;
        serviceDomain.target = '_blank';
        serviceDomain.textContent = matchedService.host;
        serviceHeader.appendChild(serviceDomain);

        popupContent.appendChild(serviceHeader);

        // Dynamic Supported Methods Section (if TOTP or U2F exists)
        let supportedMethods = [];
        if (matchedService.hasTotp) supportedMethods.push('TOTP');
        if (matchedService.hasU2f) supportedMethods.push('U2F');

        if (supportedMethods.length > 0) {
          createDataSection('Supported 2FA methods:', supportedMethods.join(', '), popupContent, false, true);
        }

        // Home Page Section (if applicable)
        // if (matchedService.host) {
        //   createDataSection('Domain:', matchedService.host, popupContent, true);
        // }
        
        // "Where to Set Up" Section
        createDataSection('Where to set up:', matchedService.doc, popupContent, true, false, 'doc');

        // "Where to Recover" Section (if applicable)
        createDataSection('Where to recover:', matchedService.rec, popupContent, true, false, 'rec');

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
  badge.className = 'badge bg-success-subtle border border-success-subtle text-success-emphasis rounded-pill me-2';
  badge.textContent = text;
  return badge;
}

// Function to create a section with a title and content, can also include badges for supported methods
function createDataSection(title, content, container, isLink = false, isBadge = false, sectionType = '') {
  const section = document.createElement('div');
  section.className = 'data-section mb-2 border border-light-subtle rounded-1 p-2 bg-white';  // Keeping your original styling

  const sectionTitle = document.createElement('h6');
  sectionTitle.textContent = title;
  sectionTitle.className = 'small mb-1';  // Keeping your original styling
  section.appendChild(sectionTitle);

  if (isBadge) {
    const contentArray = content.split(', ');
    contentArray.forEach(method => {
      const badge = createBadge(method);
      section.appendChild(badge);
    });
  } else if (isLink && content) {
    // For clickable links like Documentation and Recovery
    const link = document.createElement('a');
    link.className = 'small text-decoration-none';  // Keeping your original styling
    link.href = content.startsWith('http') ? content : `https://${content}`; // Ensure the link starts with http/https
    link.target = '_blank';
    link.textContent = content;
    section.appendChild(link);
  } else if (sectionType === 'doc' && !content) {
    // Display default message when documentation is not available
    const defaultMessage = document.createElement('p');
    defaultMessage.className = 'small text-muted mb-0';  // Keeping consistent styling
    defaultMessage.innerHTML = `
      Setup documentation is not available at the moment. If you think there is a mistake, 
      please provide the documentation URL by 
      <a href="https://github.com/40504/2fachecker/issues" target="_blank" class="text-decoration-none">
        opening a GitHub issue
      </a>
    `;
    section.appendChild(defaultMessage);
  } else if (sectionType === 'rec' && !content) {
    // Default message for missing recovery documentation
    const defaultMessage = document.createElement('p');
    defaultMessage.className = 'small text-muted mb-0';  // Your original styling
    defaultMessage.innerHTML = `
      Recovery documentation is not available at the moment. If you think there is a mistake, 
      please provide the documentation URL by 
      <a href="https://github.com/40504/2fachecker/issues" target="_blank" class="text-decoration-none">
        opening a GitHub issue
      </a>
    `;
    section.appendChild(defaultMessage);
  } else {
    const paragraph = document.createElement('p');
    paragraph.textContent = content || 'Information not available';
    section.appendChild(paragraph);
  }

  container.appendChild(section);
}

// Function to extract the top-level domain (TLD) from a hostname
function extractTLD(hostname) {
  const parts = hostname.split(".");
  return parts.slice(-2).join(".");
}