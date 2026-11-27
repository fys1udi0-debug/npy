function openCandidateModal() {
  if (state.completedLectureRankId !== state.currentRankId) {
    alert('Спочатку дочитайте лекцію до кінця.');
    return;
  }
  const rank = RANKS_DATA[state.currentRankId];
  if (!rank || !Array.isArray(rank.questions) || !rank.questions.length) {
    alert('Тест цього звання не завантажився. Перезавантажте сторінку.');
    return;
  }
  document.getElementById('cand-modal-title').textContent = rank.examTitle;
  document.getElementById('modal-candidate').classList.remove('hidden');
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const REATTESTATION_ACCESS_CODE = 'УВБ-6523';

function verifyReattestationCode(e) {
  e.preventDefault();
  const input = document.getElementById('reattestation-code');
  const error = document.getElementById('reattestation-code-error');
  if (input.value.trim() !== REATTESTATION_ACCESS_CODE) {
    error.classList.remove('hidden');
    input.focus();
    return;
  }

  state.reattestationUnlocked = true;
  error.classList.add('hidden');
  input.disabled = true;
  document.getElementById('reattestation-code-button').disabled = true;
  document.getElementById('reattestation-code-button').textContent = 'Код підтверджено';
  document.getElementById('reattestation-candidate-form').classList.remove('hidden');
}

function startReattestation(e) {
  e.preventDefault();
  if (!state.reattestationUnlocked) return;

  const name = document.getElementById('reattestation-name').value.trim();
  const staticId = document.getElementById('reattestation-static').value.trim();
  const examinerName = document.getElementById('reattestation-examiner').value.trim();
  if (!name || !staticId || !examinerName) return;

  const rank = {
    rankName: 'Переатестація',
    rankUpper: 'ПЕРЕАТЕСТАЦІЯ',
    examTitle: 'Тест переатестації',
    examMinutes: 25,
    passPercent: 85,
    questions: shuffleArray(REATTESTATION_QUESTIONS).map(item => {
      const options = shuffleArray(item.opts);
      return [item.q, options, [options.indexOf(item.correct)]];
    })
  };
  startExamSession(name, staticId, examinerName, rank, 'reattestation');
}

function startExam(e) {
  e.preventDefault();
  const name = document.getElementById('input-cand-name').value.trim();
  const staticId = document.getElementById('input-cand-static').value.trim();
  const examinerName = document.getElementById('input-cand-examiner').value.trim();
  if (!name || !staticId || !examinerName) return;

  const rank = RANKS_DATA[state.currentRankId];
  if (!rank || !Array.isArray(rank.questions) || !rank.questions.length) {
    alert('Для цього звання поки не завантажився тест. Оновіть сторінку або повідомте адміністратора.');
    return;
  }
  if (state.completedLectureRankId !== state.currentRankId) {
    alert('Спочатку дочитайте лекцію до кінця.');
    return;
  }
  closeModal('modal-candidate');
  startExamSession(name, staticId, examinerName, rank, 'rank');
}

function startExamSession(name, staticId, examinerName, rank, mode) {
  state.examMode = mode;
  state.examRank = rank;
  state.candidateName = name;
  state.candidateStatic = staticId.startsWith('#') ? staticId : `#${staticId}`;
  state.examinerName = examinerName;
  state.examQuestions = mode === 'reattestation' ? rank.questions : shuffleArray(rank.questions);
  state.examAnswers = state.examQuestions.map(() => []);
  state.currentQuestionIndex = 0;
  state.secondsLeft = rank.examMinutes * 60;
  state.examStartTime = Date.now();
  state.examActive = true;

  document.getElementById('exam-bar-rank').textContent = `АТЕСТАЦІЯ · ${rank.rankUpper}`;
  document.getElementById('exam-bar-title').textContent = rank.examTitle;
  document.getElementById('exam-cand-name').textContent = state.candidateName;
  document.getElementById('exam-cand-static').textContent = state.candidateStatic;
  document.getElementById('back-to-lecture-result').classList.toggle('hidden', mode === 'reattestation');
  renderExamQuestions();
  navigate('exam');
  startExamTimer();
}

function renderExamQuestions() {
  const nav = document.getElementById('question-nav');
  nav.innerHTML = '';
  state.examQuestions.forEach((_, idx) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'question-nav-btn';
    button.textContent = String(idx + 1);
    button.setAttribute('aria-label', `Перейти до питання ${idx + 1}`);
    button.onclick = () => goToQuestion(idx);
    nav.appendChild(button);
  });
  renderCurrentQuestion();
}

function renderCurrentQuestion() {
  const index = state.currentQuestionIndex;
  const q = state.examQuestions[index];
  if (!q) return;
  const container = document.getElementById('questions-container');
  container.innerHTML = '';

  const isMulti = q[2].length > 1;
  const inputType = isMulti ? 'checkbox' : 'radio';
  const saved = new Set(state.examAnswers[index] || []);
  const card = document.createElement('div');
  card.className = 'q-card';
  const optsHtml = q[1].map((optText, optIdx) => `
    <label class="opt-label">
      <input type="${inputType}" name="q_${index}" value="${optIdx}" ${saved.has(optIdx) ? 'checked' : ''} onchange="updateAnsweredCounter()" />
      <span>${optText}</span>
    </label>
  `).join('');
  card.innerHTML = `
    <div class="q-header">
      <div class="q-title">${index + 1}. ${q[0]}</div>
      <span class="q-badge">${isMulti ? 'Кілька відповідей' : 'Одна відповідь'}</span>
    </div>
    <div class="options-grid">${optsHtml}</div>
  `;
  container.appendChild(card);

  document.getElementById('question-nav-progress').textContent = `Питання ${index + 1} з ${state.examQuestions.length}`;
  document.getElementById('previous-question-button').disabled = index === 0;
  document.getElementById('next-question-button').classList.toggle('hidden', index === state.examQuestions.length - 1);
  document.getElementById('submit-exam-button').classList.toggle('hidden', index !== state.examQuestions.length - 1);
  updateQuestionNavigation();
}

function captureCurrentAnswer() {
  const index = state.currentQuestionIndex;
  if (!state.examQuestions[index]) return;
  state.examAnswers[index] = Array.from(document.querySelectorAll(`input[name="q_${index}"]:checked`))
    .map(input => Number(input.value))
    .sort((a, b) => a - b);
}

function updateQuestionNavigation() {
  const buttons = document.querySelectorAll('.question-nav-btn');
  buttons.forEach((button, idx) => {
    button.classList.toggle('current', idx === state.currentQuestionIndex);
    button.classList.toggle('answered', (state.examAnswers[idx] || []).length > 0);
  });
  const answered = state.examAnswers.filter(answer => answer && answer.length > 0).length;
  document.getElementById('exam-answered-count').textContent = `${answered} / ${state.examQuestions.length}`;
}

function updateAnsweredCounter() {
  captureCurrentAnswer();
  updateQuestionNavigation();
}

function goToQuestion(index) {
  if (!state.examActive || index < 0 || index >= state.examQuestions.length) return;
  captureCurrentAnswer();
  state.currentQuestionIndex = index;
  renderCurrentQuestion();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function previousQuestion() {
  goToQuestion(state.currentQuestionIndex - 1);
}

function nextQuestion() {
  goToQuestion(state.currentQuestionIndex + 1);
}

function startExamTimer() {
  clearInterval(state.timerInterval);
  updateTimerDisplay();
  state.timerInterval = setInterval(() => {
    state.secondsLeft--;
    updateTimerDisplay();
    if (state.secondsLeft <= 0) submitExam('timeout');
  }, 1000);
}

function updateTimerDisplay() {
  const mins = Math.floor(Math.max(0, state.secondsLeft) / 60);
  const secs = Math.max(0, state.secondsLeft) % 60;
  const el = document.getElementById('exam-timer');
  el.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  el.classList.toggle('danger', state.secondsLeft <= 120);
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && state.examActive) {
    submitExam('anticheat');
  }
});

function formatDuration(sec) {
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

function formatNow() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function submitExam(reason) {
  if (!state.examActive) return;
  captureCurrentAnswer();
  state.examActive = false;
  clearInterval(state.timerInterval);

  const rank = state.examRank || RANKS_DATA[state.currentRankId];
  const total = state.examQuestions.length;
  let correctCount = 0;

  state.examQuestions.forEach((q, idx) => {
    const selected = [...(state.examAnswers[idx] || [])].sort((a, b) => a - b);
    const correct = [...q[2]].sort((a, b) => a - b);
    if (selected.length === correct.length && selected.every((v, i) => v === correct[i])) correctCount++;
  });

  const wrongCount = total - correctCount;
  const percent = Math.round((correctCount / total) * 100);
  const isAnticheat = reason === 'anticheat';
  const passed = !isAnticheat && percent >= rank.passPercent;
  const durationStr = formatDuration(Math.max(1, Math.round((Date.now() - state.examStartTime) / 1000)));
  const completedAt = formatNow();

  const results = getStoredResults();
  results.unshift({
    id: Date.now(),
    date: completedAt,
    name: state.candidateName,
    staticId: state.candidateStatic,
    examiner: state.examinerName,
    rank: rank.rankName,
    correct: correctCount,
    total: total,
    percent: percent,
    duration: durationStr,
    passed: passed,
    anticheat: isAnticheat
  });
  saveStoredResults(results);

  document.getElementById('res-kicker').textContent = `РЕЗУЛЬТАТ ТЕСТУВАННЯ · ${rank.rankUpper}`;
  document.getElementById('res-exam-title').textContent = rank.examTitle;
  document.getElementById('res-pct').textContent = `${percent}%`;
  document.getElementById('res-frac').textContent = `${correctCount} / ${total}`;
  document.getElementById('res-cand').textContent = state.candidateName;
  document.getElementById('res-static').textContent = state.candidateStatic;
  document.getElementById('res-examiner').textContent = state.examinerName;
  document.getElementById('res-time').textContent = durationStr;
  document.getElementById('res-date').textContent = completedAt;
  document.getElementById('res-correct').textContent = correctCount;
  document.getElementById('res-wrong').textContent = wrongCount;
  document.getElementById('res-pass-percent').textContent = `${rank.passPercent}%`;

  const topLine = document.getElementById('res-top-line');
  const ring = document.getElementById('res-ring-circle');
  const stamp = document.getElementById('res-stamp');
  const msg = document.getElementById('res-msg');
  document.getElementById('anticheat-warning').classList.toggle('hidden', !isAnticheat);

  ring.style.strokeDashoffset = 364.4 - (percent / 100) * 364.4;
  topLine.classList.toggle('passed', passed);
  ring.classList.toggle('passed', passed);
  stamp.classList.toggle('passed', passed);

  if (passed) {
    stamp.textContent = 'СКЛАВ(ЛА)';
    const examName = state.examMode === 'reattestation' ? 'Переатестацію' : 'Атестацію';
    msg.textContent = `Вітаємо! Ви набрали ${percent}% (необхідно щонайменше ${rank.passPercent}%). ${examName} успішно пройдено.`;
  } else {
    stamp.textContent = isAnticheat ? 'АНУЛЬОВАНО' : 'НЕ СКЛАВ(ЛА)';
    msg.textContent = isAnticheat
      ? 'Іспит завершено через перемикання на іншу вкладку або вихід із вікна браузера. Результат зафіксовано.'
      : state.examMode === 'reattestation'
        ? `Ви набрали ${percent}% — для складання переатестації потрібно щонайменше ${rank.passPercent}%.`
        : `Ви набрали ${percent}% — потрібно щонайменше ${rank.passPercent}%. Перечитайте лекцію та спробуйте ще раз.`;
  }

  if (state.examMode === 'reattestation') resetReattestationGate();

  navigate('result');
}

function resetReattestationGate() {
  state.reattestationUnlocked = false;
  const input = document.getElementById('reattestation-code');
  const button = document.getElementById('reattestation-code-button');
  input.value = '';
  input.disabled = false;
  button.disabled = false;
  button.textContent = 'Підтвердити код →';
  document.getElementById('reattestation-code-error').classList.add('hidden');
  document.getElementById('reattestation-candidate-form').classList.add('hidden');
  document.getElementById('reattestation-candidate-form').reset();
}

function downloadResultImage() {
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 510;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const passed = document.getElementById('res-stamp').classList.contains('passed');
  const isAnnulled = document.getElementById('anticheat-warning').classList.contains('hidden') === false;
  const percent = document.getElementById('res-pct').textContent;
  const fraction = document.getElementById('res-frac').textContent;
  const status = document.getElementById('res-stamp').textContent;
  const warning = isAnnulled ? document.getElementById('anticheat-warning').textContent : '';
  const message = document.getElementById('res-msg').textContent;
  const fields = [
    ['КАНДИДАТ', document.getElementById('res-cand').textContent],
    ['СТАТИК', document.getElementById('res-static').textContent],
    ['ЧАС', document.getElementById('res-time').textContent],
    ['ЗАВЕРШЕНО', document.getElementById('res-date').textContent]
  ];
  const examiner = document.getElementById('res-examiner').textContent;

  const card = ctx.createLinearGradient(0, 0, 0, canvas.height);
  card.addColorStop(0, '#101b30');
  card.addColorStop(1, '#0b1322');
  ctx.fillStyle = '#080d17';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = card;
  ctx.beginPath();
  ctx.roundRect(18, 18, 1364, 474, 24);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.1)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(18, 18, 1364, 474, 24);
  ctx.clip();
  ctx.fillStyle = passed ? '#10b981' : '#f43f5e';
  ctx.fillRect(18, 18, 1364, 7);
  ctx.restore();

  const score = Number.parseInt(percent, 10) || 0;
  ctx.beginPath();
  ctx.arc(180, 214, 78, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,.09)';
  ctx.lineWidth = 13;
  ctx.stroke();
  if (score > 0) {
    ctx.beginPath();
    ctx.arc(180, 214, 78, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * score / 100);
    ctx.strokeStyle = passed ? '#10b981' : '#f43f5e';
    ctx.lineWidth = 13;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 48px Inter, Arial, sans-serif';
  ctx.fillText(percent, 180, 211);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 15px "JetBrains Mono", Consolas, monospace';
  ctx.fillText(fraction, 180, 241);

  const left = 320;
  const statusColor = passed ? '#34d399' : '#fb7185';
  ctx.textAlign = 'left';
  ctx.font = '800 25px "JetBrains Mono", Consolas, monospace';
  const statusWidth = Math.min(ctx.measureText(status).width + 38, 1000);
  ctx.strokeStyle = statusColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(left, 66, statusWidth, 54, 11);
  ctx.stroke();
  ctx.fillStyle = statusColor;
  ctx.fillText(status, left + 18, 102, statusWidth - 30);

  let textY = 160;
  if (warning) {
    ctx.fillStyle = 'rgba(244,63,94,.12)';
    ctx.strokeStyle = 'rgba(244,63,94,.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(left, 138, 1015, 52, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fecdd3';
    ctx.font = '700 16px Inter, Arial, sans-serif';
    ctx.fillText(warning, left + 16, 170, 985);
    textY = 218;
  }
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 18px Inter, Arial, sans-serif';
  drawCanvasWrappedText(ctx, message, left, textY, 1015, 27, 2);

  const boxY = 290;
  const boxGap = 14;
  const boxWidth = (1015 - boxGap * 3) / 4;
  fields.forEach(([label, value], index) => {
    const x = left + index * (boxWidth + boxGap);
    ctx.fillStyle = 'rgba(8,13,23,.78)';
    ctx.strokeStyle = 'rgba(255,255,255,.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, boxY, boxWidth, 82, 13);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.font = '700 12px "JetBrains Mono", Consolas, monospace';
    ctx.fillText(label, x + 16, boxY + 26);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 17px Inter, Arial, sans-serif';
    ctx.fillText(value, x + 16, boxY + 57, boxWidth - 28);
  });

  ctx.fillStyle = 'rgba(8,13,23,.78)';
  ctx.strokeStyle = 'rgba(255,255,255,.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(left, 385, 1015, 64, 13);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#64748b';
  ctx.font = '700 12px "JetBrains Mono", Consolas, monospace';
  ctx.fillText('ЕКЗАМЕНАТОР', left + 16, 407);
  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 17px Inter, Arial, sans-serif';
  ctx.fillText(examiner, left + 16, 434, 980);

  canvas.toBlob(blob => {
    if (!blob) return;
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `rezultat-atestatsii-${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}

function drawCanvasWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = String(text).split(/\s+/);
  let line = '';
  let lines = [];
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    let last = lines[maxLines - 1];
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length) last = last.slice(0, -1);
    lines[maxLines - 1] = `${last}…`;
  }
  lines.forEach((item, index) => ctx.fillText(item, x, y + index * lineHeight, maxWidth));
}
