const DEFAULT_API_URL = 'https://zborko.vercel.app/api/words';

browser.runtime.onMessage.addListener((request) => {
  if (request.type !== 'EXPLAIN_WORD') return;

  return (async () => {
    const { apiUrl } = await browser.storage.sync.get({ apiUrl: DEFAULT_API_URL });

    let url;

    try {
      url = new URL(apiUrl);
    } catch {
      return { data: null };
    }

    url.searchParams.set('zbor', request.word);

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();

      return {
        word: data.zbor,
        type: data.vid,
        gender: data.rod,
        explanation: data.znacenje,
      };
    } catch {
      return { data: null };
    }
  })();
});
