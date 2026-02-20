const toggleSiteBtn = document.getElementById('toggleSite');
const toggleGlobalBtn = document.getElementById('toggleGlobal');
const disabledSites = document.getElementById('disabledSites');

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function getCurrentSite() {
  const tab = await getCurrentTab();
  if (!tab?.url || !tab.url.startsWith('http')) return null;
  return new URL(tab.url).hostname;
}

async function renderState() {
  const site = await getCurrentSite();

  chrome.storage.sync.get(
    { disabledGlobally: false, disabledSites: [] },
    ({ disabledGlobally, disabledSites }) => {
      toggleGlobalBtn.textContent = disabledGlobally ? 'Turn ON globally' : 'Turn OFF globally';

      if (!site) {
        return;
      }

      const isSiteDisabled = disabledSites.includes(site);
      toggleSiteBtn.textContent = isSiteDisabled
        ? 'Turn ON for this site'
        : 'Turn OFF for this site';

      toggleSiteBtn.checked = !isSiteDisabled;
      toggleGlobalBtn.checked = !disabledGlobally;
    }
  );
}

async function toggleSite() {
  const site = await getCurrentSite();
  if (!site) return;

  const tab = await getCurrentTab();

  chrome.storage.sync.get({ disabledSites: [] }, ({ disabledSites }) => {
    let updatedSites;

    if (disabledSites.includes(site)) {
      updatedSites = disabledSites.filter((s) => s !== site);
    } else {
      updatedSites = [...disabledSites, site];
    }

    chrome.storage.sync.set({ disabledSites: updatedSites }, () => {
      chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_UPDATED' });
    });
  });
}

toggleSiteBtn.addEventListener('click', toggleSite);

toggleGlobalBtn.addEventListener('click', async () => {
  const tab = await getCurrentTab();

  chrome.storage.sync.get(
    { disabledGlobally: false, disabledSites: [] },
    async ({ disabledGlobally }) => {
      const newState = !disabledGlobally;
      chrome.storage.sync.set({ disabledGlobally: newState }, () => {
        chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_UPDATED' });
      });
    }
  );
});

chrome.storage.sync.get({ disabledSites: [] }, (stored) => {
  if (chrome.runtime.lastError) return;
  stored.disabledSites.forEach((site) => {
    const li = document.createElement('li');
    li.textContent = site;
    disabledSites.appendChild(li);
  });
});

renderState();
