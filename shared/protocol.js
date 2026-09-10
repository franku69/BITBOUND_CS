/** One vocabulary for the Story <-> Python Lab iframe boundary. */
const Message = Object.freeze({
  OPEN: 'bitbound:open-workspace',
  HIDE: 'bitbound:hide-workspace',
  CLOSE: 'bitbound:close-workspace',
  READY: 'bitbound:workspace-ready',
  PASSED: 'bitbound:challenge-passed',
  CHANGED: 'bitbound:session-changed',
  SNAPSHOT: 'bitbound:session-snapshot',
  LOAD: 'bitbound:load-session',
  SAVED: 'bitbound:session-saved',
  REPLY: 'bitbound:session-reply',
  PYTHON_READY: 'bitbound:python-ready',
  PYTHON_UNAVAILABLE: 'bitbound:python-unavailable'
});
const messageTypes = new Set(Object.values(Message));
/** Both checks matter: another tab can have the same origin as this iframe. */
function isPeerMessage(event, peer, origin) {
  return Boolean(peer && event.source === peer && event.origin === origin && event.data && typeof event.data === 'object' && !Array.isArray(event.data) && messageTypes.has(event.data.type));
}
export { Message, isPeerMessage };
