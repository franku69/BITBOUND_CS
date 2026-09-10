/** Mission presentation only. Navigation and grading belong to the controller. */
export function createMissionView({
  document,
  catalog,
  progress,
  escapeHtml: esc
}) {
  const $ = id => document.getElementById(id);
  const {
    items,
    chapters,
    chaptersById,
    chapterItems
  } = catalog;
  function renderHints(active) {
    const count = progress.state.hints[active.id] || 0;
    $('hintContent').innerHTML = active.hints.slice(0, count).map( (hint, i) => `<p><b>Hint ${i+1}:</b> ${esc(hint)}</p>`).join('');
    $('hintBtn').disabled = count >= active.hints.length;
    $('hintBtn').textContent = count >= active.hints.length ? 'All hints shown': 'Need a hint?';
  }
  function renderCompletion(active) {
    const result = progress.state.completed[active.id];
    $('taskCompletion').textContent = result ? '✓ Mission complete. You can keep practicing.': '';
    const done = Object.keys(progress.state.completed).length;
    $('totalDone').textContent = `${done}/${items.length}`;
  }
  function renderMissionList(active) {
    $('chapterList').innerHTML = chapters.map( (chapter, i) => {
      const tasks = chapterItems.get(chapter.id), count = tasks.filter(task => progress.state.completed[task.id]).length;
      return `<details class="chapter" ${chapter.id===active.chapter?'open':''}><summary><span>${String(i+1).padStart(2,'0')} · ${esc(chapter.title)}</span><span>${count}/6</span></summary><p>${esc(chapter.summary)}</p><div class="task-grid">${tasks.map(task=>`<button class="task-button ${task.id===active.id?'active':''}" data-task="${task.id}"><span class="num">${String(task.number).padStart(2,'0')}</span><span>${esc(task.title)}</span><span class="status">${progress.state.completed[task.id]?'✓':'→'}</span></button>`).join('')}</div></details>`;
    }).join('');
  }
  function renderProgress() {
    const done = items.filter(task => progress.state.completed[task.id]);
    const xp = done.reduce( (total, task) => total + task.xp, 0);
    $('studentName').value = progress.state.name;
    $('progressStats').innerHTML = `<div class="stat"><strong>${done.length}/48</strong>Missions cleared</div><div class="stat"><strong>${xp}</strong>Experience points</div><div class="stat"><strong>${Math.floor(xp/120)+1}</strong>Explorer level</div>`;
    $('progressChapters').innerHTML = chapters.map(chapter => {
      const count = chapterItems.get(chapter.id).filter(task => progress.state.completed[task.id]).length;
      return `<p>${esc(chapter.title)} · ${count}/6</p><progress max="6" value="${count}" aria-label="${esc(chapter.title)} progress"></progress>`;
    }).join('');
  }
  function renderTask(active, workspace) {
    const isFree = active.id === 'free';
    document.body.classList.toggle('free-workspace', isFree);
    $('chapterLabel').textContent = isFree ? 'FREE LAB': chaptersById.get(active.chapter).title.toUpperCase();
    $('missionNumber').textContent = isFree ? '∞': String(active.number).padStart(2, '0');
    $('taskTitle').textContent = active.title;
    $('taskConcept').textContent = active.concept;
    $('taskPrompt').textContent = active.prompt;
    $('xpLabel').textContent = isFree ? 'EXPLORE': `${active.xp} XP`;
    $('functionTip').hidden = isFree || active.number < 5;
    $('complexityText').textContent = active.complexity;
    $('workspaceLabel').textContent = isFree ? 'Free lab': `Mission ${String(active.number).padStart(2,'0')}`;
    $('checkBtn').disabled = isFree;
    $('hintBtn').parentElement.hidden = isFree;
    $('examples').hidden = isFree;
    $('solutionCode').hidden = true;
    $('exampleList').innerHTML = active.tests.map( (test, i) => `<p class="small"><b>Case ${i+1}</b></p><pre>${esc(test.setup?test.setup+'\n':'')}${esc(test.expression || 'Input: '+JSON.stringify(test.stdin||''))}\nExpected: ${esc('stdout' in test?test.stdout:JSON.stringify(test.expected))}${test.type?' ('+esc(test.type)+')':''}</pre>`).join('');
    $('stdin').value = workspace.stdin;
    $('stdinBox').open = !!workspace.stdin;
    $('previousBtn').disabled = isFree || active.number === 1;
    $('nextBtn').disabled = isFree || active.number === items.length;
    $('missionsBtn').classList.toggle('nav-current', !isFree);
    $('freeBtn').classList.toggle('nav-current', isFree);
  }
  return {
    renderHints,
    renderCompletion,
    renderMissionList,
    renderProgress,
    renderTask
  };
}
