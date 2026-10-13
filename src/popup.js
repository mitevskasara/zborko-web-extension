const toggleSiteBtn = document.getElementById('toggleSite');
const toggleGlobalBtn = document.getElementById('toggleGlobal');
const disabledSites = document.getElementById('disabledSites');
const apiUrlInput = document.getElementById('apiUrl');

const DEFAULT_API_URL = 'https://zborko.vercel.app/api/words';

async function getCurrentTab() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function getCurrentSite() {
  const tab = await getCurrentTab();
  if (!tab?.url || !tab.url.startsWith('http')) return null;
  return new URL(tab.url).hostname;
}

async function renderState() {
  const site = await getCurrentSite();

  const [{ disabledGlobally, apiUrl }, { disabledSites: sites }] = await Promise.all([
    browser.storage.sync.get({ disabledGlobally: false, apiUrl: DEFAULT_API_URL }),
    browser.storage.local.get({ disabledSites: [] }),
  ]);

  toggleGlobalBtn.textContent = disabledGlobally ? 'Turn ON globally' : 'Turn OFF globally';

  apiUrlInput.value = apiUrl;

  renderDisabledSites(sites);

  if (!site) {
    return;
  }

  const isSiteDisabled = sites.includes(site);
  toggleSiteBtn.textContent = isSiteDisabled ? 'Turn ON for this site' : 'Turn OFF for this site';

  toggleSiteBtn.checked = !isSiteDisabled;
  toggleGlobalBtn.checked = !disabledGlobally;
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

async function removeSite(site) {
  const { disabledSites: sites } = await browser.storage.local.get({ disabledSites: [] });
  const updatedSites = sites.filter((s) => s !== site);

  await browser.storage.local.set({ disabledSites: updatedSites });

  await renderState();
}

async function toggleSite() {
  const site = await getCurrentSite();
  if (!site) return;

  const tab = await getCurrentTab();

  const { disabledSites: sites } = await browser.storage.local.get({ disabledSites: [] });

  let updatedSites;

  if (sites.includes(site)) {
    updatedSites = sites.filter((s) => s !== site);
  } else {
    updatedSites = [...sites, site];
  }

  await browser.storage.local.set({ disabledSites: updatedSites });

  renderDisabledSites(updatedSites);
  browser.tabs.sendMessage(tab.id, { type: 'SETTINGS_UPDATED' }).catch(() => {});
}

toggleSiteBtn.addEventListener('click', toggleSite);

apiUrlInput.addEventListener('change', async () => {
  const value = apiUrlInput.value.trim();

  let url;
  try {
    url = new URL(value);
  } catch {
    apiUrlInput.value = DEFAULT_API_URL;
    await browser.storage.sync.set({ apiUrl: DEFAULT_API_URL });
    return;
  }

  const apiUrl = url.toString();
  apiUrlInput.value = apiUrl;
  await browser.storage.sync.set({ apiUrl });
});

disabledSites.addEventListener('click', (e) => {
  const removeBtn = e.target.closest('.popup__disabled-list__remove');
  if (!removeBtn) return;

  removeSite(removeBtn.dataset.site);
});

toggleGlobalBtn.addEventListener('click', async () => {
  const tab = await getCurrentTab();

  const { disabledGlobally } = await browser.storage.sync.get({ disabledGlobally: false });

  const newState = !disabledGlobally;
  await browser.storage.sync.set({ disabledGlobally: newState });
  browser.tabs.sendMessage(tab.id, { type: 'SETTINGS_UPDATED' }).catch(() => {});
});

renderState();
