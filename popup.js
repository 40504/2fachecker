chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  const currentTabUrl = new URL(tabs[0].url);
  const currentFullHostname = extractFullHostname(currentTabUrl.hostname); // Use full hostname
  console.log(currentFullHostname);

  // Load the supported services from the JSON file
  fetch(chrome.runtime.getURL("domains.json"))
    .then(response => response.json())
    .then(data => {
      const supportedServices = data;

      // Find the service that matches the current tab's full hostname
      const matchedService = supportedServices.find(service => service.host === currentFullHostname);

      const popupContent = document.getElementById('popup-content');
      popupContent.innerHTML = ""; // Clear previous content

      if (matchedService) {
        // Create Service Header (Service Name and Icon)
        const serviceHeader = document.createElement('div');
        serviceHeader.className = 'd-flex flex-column align-items-center mb-3';

        const serviceImage = document.createElement('img');
        serviceImage.alt = `${matchedService.name} icon`; // Alt text for accessibility
        serviceImage.style.width = '48px'; // Set default image size
        serviceImage.style.height = '48px';
        serviceImage.className = 'rounded-3 mb-3';

        // Fetch the service icon (try 256px, fallback to 64px)
        fetchServiceIcon(matchedService.host, serviceImage);

        serviceHeader.appendChild(serviceImage);

        const serviceTitle = document.createElement('h5');
        serviceTitle.textContent = matchedService.name || currentFullHostname;
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

        // "Where to Set Up" Section
        createDataSection('Where to set up:', matchedService.doc, popupContent, true, false, 'doc');

        // "Where to Recover" Section (if applicable)
        createDataSection('Where to recover:', matchedService.rec, popupContent, true, false, 'rec');

        // Notes Section (if applicable)
        if (matchedService.notes) {
          createDataSection('Notes', matchedService.notes, popupContent);
        }
      } else {
        popupContent.innerHTML = `Click to search on Google: <a href="https://www.google.com/search?q=https://${currentFullHostname}:+2fa" target="_blank">https://${currentFullHostname}: 2fa</a>`;
      }
    });
});

// Function to fetch the service icon (try 256px, fallback to 64px)
function fetchServiceIcon(host, imgElement) {
  const baseUrl = `https://authenticator.2stable.com/assets/img/2fa-services/Icons/`;
  const svgIconUrl = `${baseUrl}${host}.svg`;

  fetch(svgIconUrl)
    .then(response => {
      if (response.ok) {
        imgElement.src = svgIconUrl;
      } else {
        throw new Error('SVG icon not found, trying PNG');
      }
    })
    .catch(() => {
      const pngIconUrl = `${baseUrl}${host}.png`;
      return fetch(pngIconUrl)
        .then(response => {
          if (response.ok) {
            imgElement.src = pngIconUrl;
          } else {
            throw new Error('PNG icon not found, using Google Favicon');
          }
        })
        .catch(() => {
          // Final fallback to Google's 256px favicon
          const googleFaviconUrl = `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${host}&size=256`;
          imgElement.src = googleFaviconUrl;
        });
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
  section.className = 'data-section mb-2 border border-light-subtle rounded-1 p-2 bg-white';

  const sectionTitle = document.createElement('h6');
  sectionTitle.textContent = title;
  sectionTitle.className = 'small mb-1';
  section.appendChild(sectionTitle);

  if (isBadge) {
    const badgeContainer = document.createElement('div');
    badgeContainer.className = 'small';

    const contentArray = content.split(', ');
    contentArray.forEach(method => {
      const badge = createBadge(method);
      badgeContainer.appendChild(badge);
    });

    section.appendChild(badgeContainer);
  } else if (isLink && content) {
    const link = document.createElement('a');
    link.className = 'small text-decoration-none';
    link.href = content.startsWith('http') ? content : `https://${content}`;
    link.target = '_blank';
    link.textContent = content;
    section.appendChild(link);
  } else if (sectionType === 'doc' && !content) {
    const defaultMessage = document.createElement('p');
    defaultMessage.className = 'small text-muted mb-0';
    defaultMessage.innerHTML = `
      Setup documentation is not available at the moment. If you think there is a mistake, 
      please provide the documentation URL by 
      <a href="https://github.com/40504/2fachecker/issues" target="_blank" class="text-decoration-none">
        opening a GitHub issue
      </a>
    `;
    section.appendChild(defaultMessage);
  } else if (sectionType === 'rec' && !content) {
    const defaultMessage = document.createElement('p');
    defaultMessage.className = 'small text-muted mb-0';
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

// Function to extract the full hostname, removing 'www.' but keeping other subdomains
function extractFullHostname(hostname) {
  if (hostname.startsWith('www.')) {
    return hostname.substring(4); // Remove 'www.' from the hostname
  }
  return hostname;  // Return the hostname as it is if 'www.' is not present
}