const cache = new Map();
let tooltip;

let settings = {
  disabledGlobally: false,
  disabledSites: [],
};

function loadSettings() {
  chrome.storage.sync.get(settings, (stored) => {
    if (chrome.runtime.lastError) return;
    settings = stored;
  });
}

loadSettings();

chrome.storage.onChanged.addListener((changes) => {
  if (changes.disabledGlobally) {
    settings.disabledGlobally = changes.disabledGlobally.newValue;
  }
  if (changes.disabledSites) {
    settings.disabledSites = changes.disabledSites.newValue;
  }
});

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
  tooltip.className = 'word-tooltip';

  const bar = document.createElement('div');
  bar.className = 'word-tooltip__bar';

  const content = document.createElement('div');
  content.className = 'word-tooltip__content';

  const word = document.createElement('div');
  word.className = 'word-tooltip__word';
  word.textContent = response.word;

  const meta = document.createElement('div');
  meta.className = 'word-tooltip__meta';

  if (response.gender) {
    const gender = document.createElement('span');
    gender.textContent = response.gender;
    meta.appendChild(gender);
  }

  if (response.type) {
    if (response.gender) {
      const dot = document.createElement('div');
      dot.className = 'word-tooltip__dot';
      meta.appendChild(dot);
    }

    const type = document.createElement('span');
    type.style.fontStyle = 'italic';
    type.textContent = response.type;
    meta.appendChild(type);
  }

  const section = document.createElement('div');
  section.className = 'word-tooltip__section';

  const label = document.createElement('div');
  label.className = 'word-tooltip__label';
  label.textContent = 'Дефиниција';

  let explanation = '';
  let example = '';

  if (response.explanation) {
    const sentences = response.explanation
      .split(/(?<!\b(?:сл|дем|Дем|пр|Пр|прав|Прав))\./)
      .map((s) => s.trim());
    explanation = sentences.shift() || '';
    example = sentences.filter(Boolean);
  }

  const meaning = document.createElement('div');
  meaning.className = 'word-tooltip__meaning';
  meaning.textContent = explanation;

  section.append(label, meaning);

  if (example) {
    const exampleWrap = document.createElement('div');
    exampleWrap.className = 'word-tooltip__example';

    const exLabel = document.createElement('div');
    exLabel.className = 'word-tooltip__label';
    exLabel.textContent = 'Пример';

    const exText = document.createElement('div');
    exText.style.fontStyle = 'italic';
    exText.style.color = '#52525b';

    const lines = Array.isArray(example) ? example : String(example).split(',');

    lines
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line) => {
        const lineEl = document.createElement('div');
        lineEl.textContent = `„${line}“`;
        exText.appendChild(lineEl);
      });

    exampleWrap.append(exLabel, exText);
    section.appendChild(exampleWrap);
  }

  // const footer = document.createElement('div');
  // footer.className = 'word-tooltip__footer';
  // footer.textContent = 'Клик за копирање';

  content.append(word, meta, section);
  tooltip.append(bar, content);

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

  if (left < margin) left = margin;

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
  tooltip.style.visibility = 'visible';
};

createTooltip();

const explain = (word) => {
  if (cache.has(word)) return Promise.resolve(cache.get(word));

  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type: 'EXPLAIN_WORD', word }, (response) => {
        if (chrome.runtime.lastError) {
          resolve(null);
          return;
        }

        if (!response?.word) {
          resolve(null);
          return;
        }

        cache.set(word, response);
        resolve(response);
      });
    } catch (err) {
      resolve(null);
    }
  });
};

document.addEventListener('mouseup', async (e) => {
  try {
    if (e.target.closest('.word-extension-root')) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const word = selection.toString().trim();
    if (!word || word.split(/\s+/).length !== 1) {
      hideTooltip();
      return;
    }

    if (settings.disabledSites.includes(location.hostname)) {
      hideTooltip();
      return;
    }

    const rect = selection.getRangeAt(0).getBoundingClientRect();
    const response = await explain(word);
    if (!response) return;

    showTooltip(response, rect);
  } catch {}
});

document.addEventListener('mousedown', (e) => {
  if (!tooltip || !tooltip.contains(e.target)) {
    hideTooltip();
  }
});
