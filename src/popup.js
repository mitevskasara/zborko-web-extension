const toggleSiteBtn = document.getElementById('toggleSite');
const toggleGlobalBtn = document.getElementById('toggleGlobal');
const disabledSites = document.getElementById('disabledSites');
const apiUrlInput = document.getElementById('apiUrl');

const DEFAULT_API_URL = 'https://zborko.vercel.app/api/words';

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
    { disabledGlobally: false, disabledSites: [], apiUrl: DEFAULT_API_URL },
    ({ disabledGlobally, disabledSites: sites, apiUrl }) => {
      toggleGlobalBtn.textContent = disabledGlobally ? 'Turn ON globally' : 'Turn OFF globally';

      apiUrlInput.value = apiUrl;

      renderDisabledSites(sites);

      if (!site) {
        return;
      }

      const isSiteDisabled = sites.includes(site);
      toggleSiteBtn.textContent = isSiteDisabled
        ? 'Turn ON for this site'
        : 'Turn OFF for this site';

      toggleSiteBtn.checked = !isSiteDisabled;
      toggleGlobalBtn.checked = !disabledGlobally;
    }
  );
}

function renderDisabledSites(sites) {
  disabledSites.replaceChildren();

  if (!sites.length) {
    const empty = document.createElement('li');
    empty.className = 'popup__disabled-list__empty';
    empty.textContent = 'Нема исклучени страници';
    disabledSites.appendChild(empty);
    return;
  }

  sites.forEach((site) => {
    const li = document.createElement('li');
    li.className = 'popup__disabled-list__item';

    const name = document.createElement('span');
    name.className = 'popup__disabled-list__site';
    name.textContent = site;
    name.title = site;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'popup__disabled-list__remove';
    removeBtn.dataset.site = site;
    removeBtn.setAttribute('aria-label', `Вклучи објаснување на зборови на ${site}`);
    removeBtn.textContent = '×';

    li.append(name, removeBtn);
    disabledSites.appendChild(li);
  });
}

function removeSite(site) {
  chrome.storage.sync.get({ disabledSites: [] }, ({ disabledSites: sites }) => {
    const updatedSites = sites.filter((s) => s !== site);

    chrome.storage.sync.set({ disabledSites: updatedSites }, () => {
      apiUrlInput.addEventListener('change', () => {
        const value = apiUrlInput.value.trim();

        let url;
        try {
          url = new URL(value);
        } catch {
          apiUrlInput.value = DEFAULT_API_URL;
          chrome.storage.sync.set({ apiUrl: DEFAULT_API_URL });
          return;
        }

        const apiUrl = url.toString();
        apiUrlInput.value = apiUrl;
        chrome.storage.sync.set({ apiUrl });
      });

      renderState();
    });
  });
}

async function toggleSite() {
  const site = await getCurrentSite();
  if (!site) return;

  const tab = await getCurrentTab();

  chrome.storage.sync.get({ disabledSites: [] }, ({ disabledSites: sites }) => {
    let updatedSites;

    if (sites.includes(site)) {
      updatedSites = sites.filter((s) => s !== site);
    } else {
      updatedSites = [...sites, site];
    }

    chrome.storage.sync.set({ disabledSites: updatedSites }, () => {
      renderDisabledSites(updatedSites);
      chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_UPDATED' });
    });
  });
}

toggleSiteBtn.addEventListener('click', toggleSite);

disabledSites.addEventListener('click', (e) => {
  const removeBtn = e.target.closest('.popup__disabled-list__remove');
  if (!removeBtn) return;

  removeSite(removeBtn.dataset.site);
});

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

renderState();
