const cache = new Map();
let tooltip;
let latestRequestId = 0;

const MAX_EXAMPLES = 3;

const MACEDONIAN_LETTERS = new Set([
  ...'АБВГДЃЕЖЗЅИЈКЛЉМНЊОПРСТЌУФХЦЧЏШ',
  ...'абвгдѓежзѕијклљмнњопрстќуфхцчџш',
]);

const isMacedonianWord = (word) => {
  let hasLetter = false;

  for (const char of word) {
    if (!/\p{L}/u.test(char)) continue;

    if (!MACEDONIAN_LETTERS.has(char)) return false;

    hasLetter = true;
  }

  return hasLetter;
};

let settings = {
  disabledGlobally: false,
  disabledSites: [],
};

async function loadSettings() {
  settings = await browser.storage.sync.get(settings);
}

loadSettings();

browser.storage.onChanged.addListener((changes) => {
  if (changes.disabledGlobally) {
    settings.disabledGlobally = changes.disabledGlobally.newValue;
  }
  if (changes.disabledSites) {
    settings.disabledSites = changes.disabledSites.newValue;
  }
});

const createTooltip = () => {
  tooltip = document.createElement('div');
  document.body.appendChild(tooltip);
};

const hideTooltip = () => {
  latestRequestId++;
  tooltip.style.display = 'none';
};

const renderTooltip = (rect) => {
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

const startStatusTooltip = (word) => {
  tooltip.innerHTML = '';
  tooltip.className = 'word-tooltip word-tooltip--status';

  const bar = document.createElement('div');
  bar.className = 'word-tooltip__bar';

  const content = document.createElement('div');
  content.className = 'word-tooltip__content';

  const wordEl = document.createElement('div');
  wordEl.className = 'word-tooltip__word word-tooltip__word--compact';
  wordEl.textContent = word;

  tooltip.append(bar, content);

  return { content, wordEl };
};

const showLoader = (word, rect) => {
  const { content, wordEl } = startStatusTooltip(word);

  const status = document.createElement('div');
  status.className = 'word-tooltip__status';

  const spinner = document.createElement('span');
  spinner.className = 'word-tooltip__spinner';

  const label = document.createElement('span');
  label.textContent = 'Се бара...';

  status.append(spinner, label);
  content.append(wordEl, status);

  renderTooltip(rect);
};

const showNotFound = (word, rect) => {
  const { content, wordEl } = startStatusTooltip(word);

  const message = document.createElement('div');
  message.className = 'word-tooltip__message';
  message.textContent = 'Не е пронајдено објаснување за овој збор.';

  content.append(wordEl, message);

  renderTooltip(rect);
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

  const lines = (Array.isArray(example) ? example : String(example).split(','))
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, MAX_EXAMPLES);

  if (lines.length) {
    const exampleWrap = document.createElement('div');
    exampleWrap.className = 'word-tooltip__example';

    const exLabel = document.createElement('div');
    exLabel.className = 'word-tooltip__label';
    exLabel.textContent = 'Пример';

    const exText = document.createElement('div');
    exText.style.fontStyle = 'italic';
    exText.style.color = '#52525b';

    lines.forEach((line) => {
      const lineEl = document.createElement('div');
      lineEl.textContent = `„${line}“`;
      exText.appendChild(lineEl);
    });

    exampleWrap.append(exLabel, exText);
    section.appendChild(exampleWrap);
  }

  content.append(word, meta, section);
  tooltip.append(bar, content);

  renderTooltip(rect);
};

createTooltip();

const explain = async (word) => {
  if (cache.has(word)) return cache.get(word);

  try {
    const response = await browser.runtime.sendMessage({ type: 'EXPLAIN_WORD', word });

    if (!response?.word) {
      return null;
    }

    cache.set(word, response);
    return response;
  } catch {
    return null;
  }
};

document.addEventListener('mouseup', async (e) => {
  try {
    if (e.target.closest('.word-tooltip')) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const word = selection.toString().trim();
    if (!word || word.split(/\s+/).length !== 1 || !isMacedonianWord(word)) {
      hideTooltip();
      return;
    }

    if (settings.disabledSites.includes(location.hostname)) {
      hideTooltip();
      return;
    }

    const rect = selection.getRangeAt(0).getBoundingClientRect();

    const cached = cache.get(word);
    if (cached) {
      showTooltip(cached, rect);
      return;
    }

    const requestId = ++latestRequestId;
    showLoader(word, rect);

    const response = await explain(word);
    if (requestId !== latestRequestId) return;

    if (!response) {
      showNotFound(word, rect);
      return;
    }

    showTooltip(response, rect);
  } catch {}
});

document.addEventListener('mousedown', (e) => {
  if (!tooltip || !tooltip.contains(e.target)) {
    hideTooltip();
  }
});
