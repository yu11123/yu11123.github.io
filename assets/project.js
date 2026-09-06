(() => {
  const menuButton = document.querySelector('.menu-button');
  const nav = document.querySelector('.site-nav');
  const mobileMenuQuery = window.matchMedia('(max-width: 767px)');

  if (menuButton && nav) {
    const navLinks = [...nav.querySelectorAll('a')];
    const closeMenu = () => {
      nav.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.textContent = 'Menu';
      document.body.classList.remove('menu-open');
    };

    menuButton.addEventListener('click', () => {
      const willOpen = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', willOpen);
      menuButton.setAttribute('aria-expanded', String(willOpen));
      menuButton.textContent = willOpen ? 'Close' : 'Menu';
      document.body.classList.toggle('menu-open', willOpen);
      if (willOpen) requestAnimationFrame(() => navLinks[0]?.focus());
    });

    navLinks.forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => {
      if (!nav.classList.contains('is-open')) return;
      if (event.key === 'Escape') {
        closeMenu();
        menuButton.focus();
      }
      if (event.key === 'Tab') {
        const focusable = [menuButton, ...navLinks];
        const current = focusable.indexOf(document.activeElement);
        const next = (current + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length;
        event.preventDefault();
        focusable[next].focus();
      }
    });
    mobileMenuQuery.addEventListener('change', event => {
      if (!event.matches) closeMenu();
    });
  }

  const playlists = [...document.querySelectorAll('[data-performance-playlist]')];
  playlists.forEach(playlist => {
    const player = playlist.querySelector('[data-performance-player]');
    const youtubeLink = playlist.querySelector('[data-performance-youtube]');
    const tracks = [...playlist.querySelectorAll('[data-video-id]')];

    tracks.forEach(track => {
      track.addEventListener('click', event => {
        if (!player) return;
        event.preventDefault();

        const videoId = track.dataset.videoId;
        const videoTitle = track.dataset.videoTitle;
        if (!videoId || !videoTitle) return;

        player.src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
        player.title = videoTitle;
        tracks.forEach(item => item.removeAttribute('aria-current'));
        track.setAttribute('aria-current', 'true');

        if (youtubeLink) youtubeLink.href = track.href;
      });
    });
  });

  const inlineVideos = [...document.querySelectorAll('[data-inline-video]')];
  inlineVideos.forEach(container => {
    const video = container.querySelector('video');
    const playButton = container.querySelector('.performance-inline-play');
    const errorMessage = container.parentElement.querySelector('.performance-video-error');
    if (!video || !playButton) return;

    const showError = message => {
      if (!errorMessage) return;
      errorMessage.textContent = message;
      errorMessage.hidden = false;
    };
    const updateButton = () => {
      playButton.hidden = !video.paused && !video.ended;
    };
    updateButton();
    playButton.addEventListener('click', async () => {
      playButton.disabled = true;
      if (errorMessage) errorMessage.hidden = true;
      try {
        await video.play();
      } catch (error) {
        if (error.name !== 'AbortError') {
          showError('The video could not start. Please try the player controls or reload this page.');
        }
      } finally {
        playButton.disabled = false;
        updateButton();
      }
    });
    video.addEventListener('play', () => {
      inlineVideos.forEach(other => {
        const otherVideo = other.querySelector('video');
        if (otherVideo && otherVideo !== video) otherVideo.pause();
      });
      if (errorMessage) errorMessage.hidden = true;
      updateButton();
    });
    video.addEventListener('pause', updateButton);
    video.addEventListener('ended', updateButton);
    video.addEventListener('error', () => {
      updateButton();
      showError('This video could not load. Please reload the page and try again.');
    });
  });

  const index = document.querySelector('[data-project-index]');
  if (!index) return;

  const links = [...index.querySelectorAll('a[href^="#"]')];
  const linkTrack = index.querySelector('.project-index-links');
  const sections = links
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const updateScrollCues = () => {
    if (!linkTrack) return;
    const maxScroll = Math.max(0, linkTrack.scrollWidth - linkTrack.clientWidth);
    index.classList.toggle('has-more-left', linkTrack.scrollLeft > 2);
    index.classList.toggle('has-more-right', linkTrack.scrollLeft < maxScroll - 2);
  };

  if (linkTrack) {
    linkTrack.addEventListener('scroll', updateScrollCues, { passive: true });
    window.addEventListener('resize', updateScrollCues);
    window.requestAnimationFrame(updateScrollCues);
  }

  const setCurrent = id => {
    const currentLink = links.find(link => link.getAttribute('href') === `#${id}`);
    if (!currentLink || currentLink.getAttribute('aria-current') === 'location') return;

    links.forEach(link => link.removeAttribute('aria-current'));
    currentLink.setAttribute('aria-current', 'location');

    if (!linkTrack) return;
    const trackRect = linkTrack.getBoundingClientRect();
    const linkRect = currentLink.getBoundingClientRect();
    const isOutside = linkRect.left < trackRect.left || linkRect.right > trackRect.right;

    if (isOutside) {
      const nextLeft = currentLink.offsetLeft - (linkTrack.clientWidth - currentLink.offsetWidth) / 2;
      linkTrack.scrollTo({
        left: Math.max(0, nextLeft),
        behavior: reduceMotion ? 'auto' : 'smooth'
      });
    }

    window.requestAnimationFrame(updateScrollCues);
  };

  links.forEach(link => {
    link.addEventListener('click', () => setCurrent(link.getAttribute('href').slice(1)));
  });

  const initialId = window.location.hash.slice(1);
  if (sections.some(section => section.id === initialId)) {
    setCurrent(initialId);
  } else if (sections[0]) {
    setCurrent(sections[0].id);
  }

  if (!('IntersectionObserver' in window)) return;

  const ratios = new Map(sections.map(section => [section.id, 0]));
  const updateCurrentSection = entries => {
    entries.forEach(entry => ratios.set(entry.target.id, entry.intersectionRatio));

    const visibleSection = sections
      .filter(section => (ratios.get(section.id) || 0) > 0)
      .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)
      .at(-1);

    if (visibleSection) setCurrent(visibleSection.id);
  };

  let observer;
  const observeSections = () => {
    if (observer) observer.disconnect();
    sections.forEach(section => ratios.set(section.id, 0));
    const styles = getComputedStyle(document.documentElement);
    const headerHeight = Number.parseFloat(styles.getPropertyValue('--header-height')) || 0;
    const indexHeight = Number.parseFloat(styles.getPropertyValue('--index-height')) || 0;
    // IntersectionObserver percentages use viewport width, even for vertical margins.
    const bottomMargin = Math.round(window.innerHeight * .58);
    observer = new IntersectionObserver(updateCurrentSection, {
      rootMargin: `-${headerHeight + indexHeight + 12}px 0px -${bottomMargin}px 0px`,
      threshold: [0, .01, .2, .5]
    });
    sections.forEach(section => observer.observe(section));
  };
  observeSections();
  window.addEventListener('resize', observeSections);
})();
