const cache = new Map();
let tooltip;

const createTooltip = () => {
  tooltip = document.createElement('div');
  tooltip.className = 'word-explainer-tooltip';
  document.body.appendChild(tooltip);
};

const hideTooltip = () => {
  tooltip.style.display = 'none';
};

const showTooltip = (response, rect) => {
  tooltip.innerHTML = '';

  const wordEl = document.createElement('div');
  wordEl.className = 'word-explainer-tooltip__word';
  wordEl.textContent = response.word;

  const typeEl = document.createElement('div');
  typeEl.className = 'word-explainer-tooltip__type';
  typeEl.textContent = `${response.type}, ${response.gender} род`;

  tooltip.appendChild(wordEl);
  tooltip.appendChild(typeEl);

  response.explanations.forEach((exp, idx) => {
    const meaningEl = document.createElement('div');
    meaningEl.className = 'word-explainer-tooltip__meaning';
    meaningEl.textContent = `${idx + 1}. ${exp.meaning}`;
    tooltip.appendChild(meaningEl);

    const exampleEl = document.createElement('div');
    exampleEl.className = 'word-explainer-tooltip__example';
    exampleEl.textContent = 'Пример: ' + exp.example;
    if (idx < response.explanations.length) {
      exampleEl.style.marginBottom = '10px';
    }
    tooltip.appendChild(exampleEl);
  });

  tooltip.style.display = 'block';
  tooltip.style.visibility = 'hidden';

  const margin = 8;
  const tooltipRect = tooltip.getBoundingClientRect();
  const viewportWidth = window.innerWidth;

  let top = rect.top + window.scrollY - tooltipRect.height - margin;
  let left = rect.left + window.scrollX;

  if (rect.top - tooltipRect.height - margin < 0) {
    top = rect.bottom + window.scrollY + margin;
  }

  if (left + tooltipRect.width > viewportWidth) {
    left = viewportWidth - tooltipRect.width - margin;
  }

  if (left < margin) {
    left = margin;
  }

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
  tooltip.style.visibility = 'visible';
};

createTooltip();

const explain = (word) => {
  if (cache.has(word)) return Promise.resolve(cache.get(word));

  // const prompt = `Објасни го зборот "${word}" на македонски јазик. Користи едноставен и јасен јазик. Објаснувањето да биде максимум 2 реченици.`;

  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'EXPLAIN_WORD', word }, (response) => {
      if (!response?.word) {
        resolve(null);
        return;
      }
      cache.set(word, response.word);
      resolve(response);
    });
  });
};

document.addEventListener('mouseup', async () => {
  const selection = window.getSelection();
  const word = selection.toString().trim();

  if (!word || word.split(/\s+/).length !== 1) {
    hideTooltip();
    return;
  }

  const site = window.location.hostname;

  chrome.storage.sync.get(
    { disabledGlobally: false, disabledSites: [] },
    async ({ disabledGlobally, disabledSites }) => {
      if (disabledGlobally || disabledSites.includes(site)) {
        hideTooltip();
        return;
      }

      const rect = selection.getRangeAt(0).getBoundingClientRect();
      // showTooltip('ЗборКО размислува...', rect);

      try {
        const response = await explain(word);
        showTooltip(response, rect);
      } catch (err) {
        hideTooltip();
        console.error('Error fetching explanation:', err);
      }
    }
  );
});

document.addEventListener('mousedown', () => hideTooltip());
