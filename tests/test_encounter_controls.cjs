'use strict';
const assert = require('node:assert/strict');
const { buildContext } = require('./helpers/game-harness.cjs');
const h = buildContext('?quality=low'), a = h.sandbox.TestAPI;
a.startNew(); a.enterWorld(); a.player.x = 720; a.player.y = 200; a.state.boss = null;
const enemy = {id: 999, x: 750, y: 200, w: 28, h: 25, type: 'slime', alive: true, questionMob: true};
assert.ok(a.openQuestionEncounter(enemy));
const ui = a.encounterUI, active = a.questionDirector.active;
const emit = (key, target, repeat = false) => {
  const event = {key, target, repeat, defaultPrevented: false, preventDefault() {this.defaultPrevented = true;}};
  ui.overlay.listeners.keydown.forEach(fn => fn(event));
  h.listeners.keydown.forEach(fn => fn(event));
  return event;
};
const expectedIds = [...active.set].map(q => q.id);
for (let round = 0; round < expectedIds.length; round++) {
  assert.equal(active.round, round);
  assert.equal(active.selected, null);
  assert.ok(ui.next.disabled);
  assert.equal(ui.next.onclick(), false, 'no selection cannot submit');
  assert.ok(a.state.paused);
  ui.previous.onclick();
  assert.equal(active.selected, active.question.choices.length - 1);
  ui.following.onclick(); assert.equal(active.selected, 0, 'pad wraps through choices');
  emit('ArrowDown', ui.choices.children[0]); assert.equal(active.selected, 1);
  const correct = active.question.answer, wrong = (correct + 1) % active.question.choices.length;
  ui.choices.children[wrong].onclick();
  assert.equal(active.correct, false);
  assert.equal(emit('Enter', ui.choices.children[wrong], true).defaultPrevented, true);
  assert.equal(active.selected, wrong, 'held Enter does not submit');
  emit('Enter', ui.choices.children[wrong]);
  assert.ok(ui.next.disabled); assert.equal(active.correct, false);
  assert.match(ui.feedback.textContent, /Not yet/);
  ui.hint.onclick(); assert.match(ui.feedback.textContent, /Clue/);
  ui.choices.children[correct].onclick();
  // Repeated selection is safe and does not grade on pointer release.
  ui.choices.children[correct].onclick(); assert.equal(active.correct, false);
  assert.equal(ui.choices.children[correct].attributes['aria-pressed'], 'true');
  assert.equal(emit('Enter', ui.save).defaultPrevented, false, 'Save keeps its native activation');
  emit('Enter', ui.choices.children[correct]);
  assert.ok(active.correct); assert.ok(ui.next.focused);
  assert.ok(ui.previous.disabled && ui.following.disabled);
  assert.equal(a.state.encounterRead[active.question.id], undefined);
  ui.panel.scrollTop = 200; ui.content.scrollTop = 300;
  ui.next.onclick();
  assert.equal(a.state.encounterRead[expectedIds[round]], true);
  if (round + 1 < expectedIds.length) {
    ui.next.onclick();
    assert.equal(active.round, round + 1, 'double-tapping Next cannot skip an unanswered round');
    assert.equal(ui.panel.scrollTop, 0);
    assert.equal(ui.content.scrollTop, 0, 'portrait reading starts at the new question');
  }
}
assert.equal(a.questionDirector.active, null); assert.equal(a.state.paused, false);
assert.equal(enemy.alive, false);
console.log('PASS encounter controls: selection/confirmation, keyboard and pad navigation, wrong-answer retry, native Save, explicit Next, no repeat-submit/round skip, complete set and resume.');
