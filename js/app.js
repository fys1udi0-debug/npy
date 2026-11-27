let state = {
  currentRankId: 'private',
  completedLectureRankId: null,
  examActive: false,
  examQuestions: [],
  examAnswers: [],
  currentQuestionIndex: 0,
  candidateName: '',
  candidateStatic: '',
  examinerName: '',
  timerInterval: null,
  secondsLeft: 25 * 60,
  examStartTime: null,
  examMode: 'rank',
  examRank: null,
  reattestationUnlocked: false
};

function navigate(target) {
  if (state.examActive && target !== 'exam') return;

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  if (target === 'home' || target === 'ranks') {
    document.getElementById('view-home').classList.add('active');
    document.querySelector(`[data-nav="${target}"]`)?.classList.add('active');
    if (target === 'ranks') scrollToRanks();
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (target === 'lecture') {
    document.getElementById('view-lecture').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (target === 'exam') {
    document.getElementById('view-exam').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (target === 'result') {
    document.getElementById('view-result').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (target === 'pomichnyk') {
    document.getElementById('view-pomichnyk').classList.add('active');
    document.querySelector('[data-nav="pomichnyk"]')?.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (target === 'promotion') {
    document.getElementById('view-promotion').classList.add('active');
    document.querySelector('[data-nav="promotion"]')?.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (target === 'reattestation') {
    document.getElementById('view-reattestation').classList.add('active');
    document.querySelector('[data-nav="reattestation"]')?.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function scrollToRanks() {
  document.getElementById('ranks-anchor')?.scrollIntoView({ behavior: 'smooth' });
}

function toggleHowItWorks() {
  document.getElementById('how-it-works-box').classList.toggle('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function showActivationKey() {
  const button = document.getElementById('activation-key-button');
  if (button.disabled) return;

  const loader = document.getElementById('activation-key-loader');
  const result = document.getElementById('activation-key-result');
  button.disabled = true;
  loader.classList.remove('hidden');
  window.setTimeout(() => {
    loader.classList.add('hidden');
    result.classList.remove('hidden');
  }, 1100);
}

function backToLectureFromResult() {
  openLecture(state.currentRankId);
}
