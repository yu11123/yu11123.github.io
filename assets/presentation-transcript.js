(() => {
  'use strict';
  const transcript = document.querySelector('.speech-transcript');
  if (!transcript) return;
  const reader = transcript.querySelector('.transcript-reader');
  const texts = [...transcript.querySelectorAll('[data-transcript-text]')];
  const languages = [...transcript.querySelectorAll('[data-transcript-language]')];
  const links = [...transcript.querySelectorAll('[data-transcript-chapter]')];
  const chapters = links.map(link => link.dataset.transcriptChapter);
  const expand = transcript.querySelector('.transcript-expand');
  const pager = transcript.querySelector('.transcript-pager');
  const steps = [...pager.querySelectorAll('[data-transcript-step]')];
  const player = transcript.querySelector('iframe');
  const status = transcript.querySelector('.transcript-status');
  let language = 'en';
  let chapter = 'work';
  let expanded = false;

  const activeText = () => texts.find(text => text.dataset.transcriptText === language);
  const chapterElement = name => activeText().querySelector('[data-speech-chapter="' + name + '"]');
  const render = () => {
    texts.forEach(text => {
      text.hidden = text.dataset.transcriptText !== language;
      text.querySelectorAll('[data-speech-chapter]').forEach(section => {
        section.hidden = !expanded && section.dataset.speechChapter !== chapter;
      });
    });
    languages.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.transcriptLanguage === language)));
    links.forEach(link => {
      link.href = '#transcript-' + (language === 'en' ? 'en' : 'zh') + '-' + link.dataset.transcriptChapter;
      if (link.dataset.transcriptChapter === chapter) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    transcript.classList.toggle('is-expanded', expanded);
    expand.setAttribute('aria-expanded', String(expanded));
    expand.textContent = expanded ? 'Read by section' : 'Show full text';
    pager.hidden = expanded;
    const index = chapters.indexOf(chapter);
    steps.forEach(button => {
      const target = index + Number(button.dataset.transcriptStep);
      button.disabled = target < 0 || target >= chapters.length;
    });
    pager.querySelector('.transcript-page-number').textContent = (index + 1) + ' / ' + chapters.length;
    reader.setAttribute('aria-label', language === 'en' ? 'Speech transcript in English' : '演講中文逐字稿');
  };
  const goToChapter = name => {
    if (!chapters.includes(name)) return;
    chapter = name;
    render();
    chapterElement(chapter).scrollIntoView({block: 'start', behavior: 'instant'});
    reader.focus({preventScroll: true});
  };
  const readHash = () => {
    const match = window.location.hash.match(/^#transcript-(en|zh)-(work|care|action)$/);
    if (!match) return;
    language = match[1] === 'zh' ? 'zh-Hant' : 'en';
    goToChapter(match[2]);
  };

  transcript.classList.add('is-enhanced');
  transcript.querySelector('.transcript-languages').hidden = false;
  expand.hidden = false;
  render();
  readHash();
  window.addEventListener('hashchange', readHash);
  links.forEach(link => link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    goToChapter(link.dataset.transcriptChapter);
  }));
  steps.forEach(button => button.addEventListener('click', () => {
    goToChapter(chapters[chapters.indexOf(chapter) + Number(button.dataset.transcriptStep)]);
  }));
  languages.forEach(button => button.addEventListener('click', () => {
    if (button.dataset.transcriptLanguage === language) return;
    language = button.dataset.transcriptLanguage;
    render();
  }));
  expand.addEventListener('click', () => {
    expanded = !expanded;
    render();
    chapterElement(chapter).scrollIntoView({block: 'start', behavior: 'instant'});
    reader.focus({preventScroll: true});
  });
  if (player) transcript.querySelectorAll('[data-speech-start]').forEach(link => {
    // Keep timestamped YouTube links usable without JavaScript.
    link.textContent = link.textContent.replace(' ↗', '');
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const start = Number(link.dataset.speechStart);
      if (![43, 225, 372].includes(start)) return;
      event.preventDefault();
      const url = new URL('https://www.youtube-nocookie.com/embed/Nh_SEOeOrTc');
      url.searchParams.set('rel', '0');
      url.searchParams.set('start', String(start));
      url.searchParams.set('autoplay', '1');
      url.searchParams.set('playsinline', '1');
      player.src = url.href;
      status.textContent = language === 'en'
        ? 'The video is loading at ' + link.textContent.replace('Play from ', '') + '. If playback does not start, press Play.'
        : '上方影片已載入指定時間；若未自動播放，請按播放鍵。';
    });
  });
})();
