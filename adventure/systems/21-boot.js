/* ------------------------ Boot ------------------------------ */
function boot() {
  initCharacterCreator();
  initPetPicker();
  updateHotbar();
  updateAcademicHud();
  updateCampaignHud();
  generateWorld(0);
  resetPlayer(false);
  refreshPerformanceLabel();
  document.body.classList.add('adventure-paused');
  draw();
}
boot();
AudioEngine.syncMusic();
for (const event of ['pointerdown', 'keydown']) document.addEventListener(event, () => {
  if (!document.hidden) ensureAudio();
}, { passive: true });
// Keep music reachable inside modal focus traps without floating over the story.
for (const overlay of UI.overlays) {
  const content = overlay.firstElementChild;
  if (!content) continue;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'section-music-toggle';
  button.dataset.storyMusic = '';
  button.setAttribute('aria-label', 'Toggle background music');
  button.onclick = () => {
    ensureAudio();
    AudioEngine.toggleMusic();
  };
  const controls = content.querySelector?. ('.story-scene-footer > div, .mentor-controls, .start-actions, .python-window-head .challenge-actions');
  (controls || content).appendChild(button);
}
updateAudioButtons();
