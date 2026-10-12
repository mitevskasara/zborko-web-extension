const DEFAULT_API_URL = 'https://zborko.vercel.app/api/words';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type !== 'EXPLAIN_WORD') return;

  chrome.storage.sync.get({ apiUrl: DEFAULT_API_URL }, ({ apiUrl }) => {
    let url;

    try {
      url = new URL(apiUrl);
    } catch {
      sendResponse({ data: null });
      return;
    }

    url.searchParams.set('zbor', request.word);

    fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        sendResponse({
          word: data.zbor,
          type: data.vid,
          gender: data.rod,
          explanation: data.znacenje,
        });
      })
      .catch(() => sendResponse({ data: null }));
  });

  return true;
});
