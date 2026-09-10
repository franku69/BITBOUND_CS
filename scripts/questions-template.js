// Curriculum delivery adapter. Payloads are injected by buildlib/curriculum.py.
(() => {
  'use strict';
  const encounters = Object.freeze(__ENCOUNTERS__);
  const bank = Object.freeze(__BANK__);
  const byId = new Map(bank.map(item => [item.id, item]));
  const worldIds = __WORLDS__;
  const lessons = __LESSONS__;
  const story = Object.freeze(__STORY__);
  const tutorials = Object.freeze(__TUTORIALS__);

  function get(id) {
    if (!byId.has(id)) throw new Error('Unknown mission: ' + id);
    return byId.get(id);
  }

  function validate() {
    if (bank.length !== 48 || byId.size !== 48 || worldIds.length !== 8 ||
        new Set(worldIds.flat()).size !== 48 || bank.some(item => item.type !== 'code' || !item.q)) {
      throw new Error('Invalid adventure curriculum');
    }
    return true;
  }

  window.BitboundQuestions = Object.freeze({bank, worldIds, lessons, tutorials, story, encounters, get, validate});
})();
