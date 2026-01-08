const toggleSiteBtn = document.getElementById('toggleSite');
const toggleAllBtn = document.getElementById('toggleAll');
const enableAllBtn = document.getElementById('enableAll');

async function getCurrentSite() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return new URL(tab.url).hostname;
}

toggleSiteBtn.addEventListener('click', async () => {
  const site = await getCurrentSite();
  chrome.storage.sync.get({ disabledSites: [] }, ({ disabledSites }) => {
    if (!disabledSites.includes(site)) {
      disabledSites.push(site);
      chrome.storage.sync.set({ disabledSites }, () => {
        alert(`Extension turned off for ${site}`);
      });
    } else {
      alert(`Extension is already off for ${site}`);
    }
  });
});

toggleAllBtn.addEventListener('click', () => {
  chrome.storage.sync.set({ disabledGlobally: true }, () => {
    alert('Extension turned off globally');
  });
});

enableAllBtn.addEventListener('click', () => {
  chrome.storage.sync.set({ disabledGlobally: false }, () => {
    alert('Extension turned on globally');
  });
});
