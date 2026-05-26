'use strict';

class Quiz {
  constructor(containerId, questions, topicKey, feedbackPromptFn) {
    this.containerId      = containerId;
    this.questions        = questions;
    this.topicKey         = topicKey;
    this.feedbackPromptFn = feedbackPromptFn;

    this.answers   = new Array(questions.length).fill(null);
    this.submitted = false;

    this._notesEl   = document.getElementById('screen-notes');
    this._quizEl    = document.getElementById('screen-quiz');
    this._resultsEl = document.getElementById('screen-results');

    this._progressFill = document.getElementById('quiz-progress-fill');
    this._progressText = document.getElementById('quiz-progress-text');
    this._submitBtn    = document.getElementById('quiz-submit-btn');

    if (this._submitBtn) {
      this._submitBtn.addEventListener('click', () => this.submit());
    }
  }

  /* ── Render question cards ──────────────────────────── */
  build() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = '';

    this.questions.forEach((q, qi) => {
      const letters = ['A', 'B', 'C', 'D'];
      const card = document.createElement('div');
      card.className = 'question-card';
      card.id = `qcard-${qi}`;

      let codeHtml = '';
      if (q.code) {
        codeHtml = `<div class="q-code"><pre><code>${this._esc(q.code)}</code></pre></div>`;
      }

      const optionsHtml = q.opts.map((opt, oi) => `
        <button
          class="option-btn"
          id="opt-${qi}-${oi}"
          data-qi="${qi}"
          data-oi="${oi}"
          aria-label="Option ${letters[oi]}: ${this._esc(opt)}"
        >
          <span class="option-letter">${letters[oi]}</span>
          <span class="option-text">${this._esc(opt)}</span>
        </button>
      `).join('');

      card.innerHTML = `
        <div class="q-number">Question ${qi + 1} of ${this.questions.length}</div>
        <div class="q-text">${this._esc(q.q)}</div>
        <div class="q-source">${this._esc(q.source)}</div>
        ${codeHtml}
        <div class="q-options">
          ${optionsHtml}
        </div>
      `;

      container.appendChild(card);
    });

    /* Bind option clicks after DOM is ready */
    this.questions.forEach((_, qi) => {
      this.questions[qi].opts.forEach((_, oi) => {
        const btn = document.getElementById(`opt-${qi}-${oi}`);
        if (btn) btn.addEventListener('click', () => this.pick(qi, oi));
      });
    });

    this._updateProgress();
    if (this._submitBtn) {
      this._submitBtn.disabled = true;
    }
  }

  /* ── Record answer ──────────────────────────────────── */
  pick(qi, oi) {
    if (this.submitted) return;

    const prev = this.answers[qi];
    this.answers[qi] = oi;

    /* Deselect previous */
    if (prev !== null) {
      const prevBtn = document.getElementById(`opt-${qi}-${prev}`);
      if (prevBtn) prevBtn.classList.remove('selected');
    }

    /* Select current */
    const btn = document.getElementById(`opt-${qi}-${oi}`);
    if (btn) btn.classList.add('selected');

    /* Mark card as answered */
    const card = document.getElementById(`qcard-${qi}`);
    if (card) card.classList.add('answered');

    this._updateProgress();

    /* Enable submit when all answered */
    const allAnswered = this.answers.every(a => a !== null);
    if (this._submitBtn) {
      this._submitBtn.disabled = !allAnswered;
    }
  }

  /* ── Grade and apply result styles ─────────────────── */
  submit() {
    if (this.submitted) return;

    const allAnswered = this.answers.every(a => a !== null);
    if (!allAnswered) return;

    this.submitted = true;
    if (this._submitBtn) this._submitBtn.disabled = true;

    let score = 0;
    const wrong = [];

    this.questions.forEach((q, qi) => {
      const selected = this.answers[qi];
      const correct  = q.answer;
      const isRight  = selected === correct;

      if (isRight) {
        score++;
      } else {
        wrong.push({ qi, q, selected, correct });
      }

      q.opts.forEach((_, oi) => {
        const btn = document.getElementById(`opt-${qi}-${oi}`);
        if (!btn) return;

        btn.disabled = true;
        btn.classList.remove('selected');

        if (oi === correct) {
          btn.classList.add('correct');
        } else if (oi === selected) {
          btn.classList.add('wrong-selected');
        } else {
          btn.classList.add('dimmed');
        }
      });
    });

    this.saveScore(score);

    /* Swap submit for results button */
    if (this._submitBtn) {
      this._submitBtn.textContent = 'See results →';
      this._submitBtn.disabled = false;
      this._submitBtn.removeEventListener('click', () => this.submit());
      this._submitBtn.onclick = () => this.showResults(score, wrong);
    }
  }

  /* ── Transition to results screen ──────────────────── */
  showResults(score, wrong) {
    updateMode(3);
    this._transitionTo(this._quizEl, this._resultsEl);

    /* Score display */
    const scoreNum  = document.getElementById('score-number');
    const scorePct  = document.getElementById('score-pct');
    const scoreGrade = document.getElementById('score-grade');

    if (scoreNum)  scoreNum.textContent  = score;
    if (scorePct)  scorePct.textContent  = Math.round((score / this.questions.length) * 100) + '%';
    if (scoreGrade) {
      const pct = Math.round((score / this.questions.length) * 100);
      let grade = 'Keep studying';
      if (pct >= 90) grade = 'Excellent';
      else if (pct >= 75) grade = 'Good';
      else if (pct >= 60) grade = 'Passing';
      scoreGrade.textContent = grade;
    }

    this.fetchFeedback(score, wrong);
  }

  /* ── Fetch AI feedback ──────────────────────────────── */
  fetchFeedback(score, wrong) {
    const box     = document.getElementById('feedback-box');
    const loading = document.getElementById('feedback-loading');

    if (!box) return;

    if (loading) loading.style.display = 'flex';
    box.style.display = 'none';

    const key = window.ANTHROPIC_KEY;
    if (!key || key === 'YOUR_API_KEY_HERE') {
      this._showFeedback(box, loading, 'Add your Anthropic API key to the page to enable AI feedback.');
      return;
    }

    const wrongText = wrong.length === 0
      ? 'None — perfect score!'
      : wrong.map(w => {
          const letters = ['A', 'B', 'C', 'D'];
          return `Q${w.qi + 1}: "${w.q.q}" — Selected: ${letters[w.selected]} (${w.q.opts[w.selected]}), Correct: ${letters[w.correct]} (${w.q.opts[w.correct]})`;
        }).join('\n');

    const prompt = this.feedbackPromptFn(score, wrongText);

    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
      .then(r => {
        if (!r.ok) {
          throw new Error(`API error: ${r.status}`);
        }
        return r.json();
      })
      .then(data => {
        if (data.error) {
          throw new Error(data.error.message || 'API error');
        }
        const text = data?.content?.[0]?.text ?? 'Unable to parse feedback response.';
        this._showFeedback(box, loading, text);
      })
      .catch(error => {
        console.error('Feedback error:', error);
        this._showFeedback(box, loading, 'Unable to generate feedback. Please try again.');
      });
  }

  _showFeedback(box, loading, text) {
    if (loading) loading.style.display = 'none';
    box.textContent = text;
    box.style.display = 'block';
  }

  /* ── Retry — rebuild quiz ───────────────────────────── */
  retry() {
    this.answers   = new Array(this.questions.length).fill(null);
    this.submitted = false;

    if (this._submitBtn) {
      this._submitBtn.textContent = 'Submit answers';
      this._submitBtn.onclick = () => this.submit();
    }

    updateMode(2);
    this._transitionTo(this._resultsEl, this._quizEl);
    this.build();
  }

  /* ── Reset to notes screen ──────────────────────────── */
  reset() {
    this.answers   = new Array(this.questions.length).fill(null);
    this.submitted = false;

    updateMode(1);
    this._transitionTo(this._resultsEl, this._notesEl);
  }

  /* ── Persist score ──────────────────────────────────── */
  saveScore(score) {
    try {
      localStorage.setItem(this.topicKey, score);
    } catch (_) {}
  }

  loadScore() {
    try {
      return localStorage.getItem(this.topicKey);
    } catch (_) {
      return null;
    }
  }

  /* ── Progress helpers ───────────────────────────────── */
  _updateProgress() {
    const answered = this.answers.filter(a => a !== null).length;
    const total    = this.questions.length;
    const pct      = (answered / total) * 100;

    if (this._progressFill) this._progressFill.style.width = pct + '%';
    if (this._progressText) this._progressText.textContent = `${answered} / ${total} answered`;
  }

  /* ── HTML escape ────────────────────────────────────── */
  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ── Screen fade transition ─────────────────────────── */
  _transitionTo(hideEl, showEl) {
    if (!hideEl || !showEl) return;

    hideEl.classList.add('fading');
    setTimeout(() => {
      hideEl.classList.add('hidden');
      hideEl.classList.remove('fading');

      showEl.classList.remove('hidden');
      /* Force reflow so the transition fires */
      void showEl.offsetWidth;
      showEl.classList.remove('fading');
    }, 200);
  }
}

/* ── Mode indicator ─────────────────────────────────────── */
function updateMode(step) {
  const steps = document.querySelectorAll('.mode-step');
  steps.forEach((el, i) => {
    el.classList.toggle('active', i + 1 === step);
  });
}

/* ── Ready button handler (used inline in xss.html) ────── */
function goToQuiz(quiz) {
  updateMode(2);
  const notesEl = document.getElementById('screen-notes');
  const quizEl  = document.getElementById('screen-quiz');
  if (!notesEl || !quizEl) return;

  notesEl.classList.add('fading');
  setTimeout(() => {
    notesEl.classList.add('hidden');
    notesEl.classList.remove('fading');
    quizEl.classList.remove('hidden');
    void quizEl.offsetWidth;
    quizEl.classList.remove('fading');
  }, 200);
}
