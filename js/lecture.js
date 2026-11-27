function openLecture(rankId) {
  state.currentRankId = rankId;
  state.completedLectureRankId = null;
  const rank = RANKS_DATA[rankId];
  if (!rank || !Array.isArray(rank.sections) || !Array.isArray(rank.questions) || !rank.questions.length) {
    alert('Не вдалося завантажити лекцію та тест цього звання. Перезавантажте сторінку.');
    return;
  }

  const ep = document.getElementById('lecture-epaulette');
  ep.innerHTML = '<span class="ep-btn"></span>' + '<span class="chevron"></span>'.repeat(rank.chevrons);

  document.getElementById('lecture-kicker').textContent = `КРОК 1 З 2 · ЛЕКЦІЯ НА ЗВАННЯ «${rank.rankUpper}»`;
  document.getElementById('lecture-title').textContent = rank.title;
  document.getElementById('lecture-read-time').textContent = rank.readTime;
  document.getElementById('lecture-next-exam').textContent = `Далі: ${rank.examTitle.split('—')[0].trim()} · ${rank.questions.length} питань`;
  document.getElementById('step2-desc').textContent = `${rank.examTitle}. ${rank.questions.length} питань, ${rank.examMinutes} хвилин, прохідний бал — ${rank.passPercent}%. Таймер стартує лише після того, як ви вкажете свої дані та натиснете «Почати тест».`;

  const toc = document.getElementById('lecture-toc');
  const content = document.getElementById('lecture-content');
  toc.innerHTML = '';
  content.innerHTML = '';
  document.getElementById('exam-lock-hint').classList.remove('hidden');

  rank.sections.forEach(sec => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="#${sec.id}">${sec.title}</a>`;
    toc.appendChild(li);

    const div = document.createElement('div');
    div.className = 'lec-section';
    div.id = sec.id;
    div.innerHTML = `<h3>${sec.title}</h3>${sec.html}`;
    content.appendChild(div);
  });

  navigate('lecture');
  setTimeout(updateReadingProgress, 80);
}

function updateReadingProgress() {
  const lecView = document.getElementById('view-lecture');
  if (!lecView || !lecView.classList.contains('active')) return;

  const article = document.getElementById('lecture-content');
  const rect = article.getBoundingClientRect();
  const winH = window.innerHeight;
  const articleFinished = rect.bottom <= winH + 40;
  const visibleAmount = Math.max(0, Math.min(rect.height, winH - rect.top));
  const pct = articleFinished ? 100 : Math.max(3, Math.min(99, Math.round((visibleAmount / Math.max(1, rect.height)) * 100)));
  document.getElementById('read-percent').textContent = `${pct}%`;
  document.getElementById('read-progress-bar').style.width = `${pct}%`;
  if (pct >= 100) state.completedLectureRankId = state.currentRankId;
  document.getElementById('exam-lock-hint').classList.toggle('hidden', state.completedLectureRankId === state.currentRankId);
}

window.addEventListener('scroll', updateReadingProgress, { passive: true });
