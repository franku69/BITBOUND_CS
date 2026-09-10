/**
 * Deterministic learning order, independent of spawning, rendering and storage.
 * The catalog is indexed once. Reads inspect at most one world's short path.
 * Progress is supplied by the caller, so a new student never inherits it.
 */
function createLearningPath(questions, worldCount, setSize = 4) {
  const byId = new Map();
  const worlds = Array.from({ length: worldCount }, () => []);
  for (const question of questions) {
    if (byId.has(question.id)) throw new Error(`Duplicate lesson: ${question.id}`);
    if (!Number.isInteger(question.world) || !worlds[question.world]) {
      throw new Error(`Invalid world for lesson: ${question.id}`);
    }
    byId.set(question.id, question);
    worlds[question.world].push(question);
  }
  for (const path of worlds) {
    path.sort( (a, b) => a.sequence - b.sequence);
    Object.freeze(path);
  }
  Object.freeze(worlds);
  function progress(level, read, stage = 4) {
    let done = 0, total = 0, next = null;
    for (const question of worlds[level] || []) {
      if (question.stage > stage) continue;
      total++;
      if (read?.[question.id]) done++; else if (next === null) next = question;
    }
    return {
      done,
      total,
      remaining: total - done,
      next
    };
  }
  function lessonSet(level, read, limitStage = 4) {
    const path = worlds[level] || [];
    const next = path.find(question => question.stage <= limitStage && !read?.[question.id]);
    if (!next) return [];
    const result = [];
    for (const question of path) {
      if (question.stage === next.stage && !read?.[question.id]) {
        result.push(question);
        if (result.length === setSize) break;
      }
    }
    return result;
  }
  function nextQuestion(level, read, reviewPosition = 0) {
    const path = worlds[level];
    if (!path?.length) return null;
    return path.find(question => !read?.[question.id]) || path[reviewPosition % path.length];
  }
  return Object.freeze({
    byId,
    worlds,
    progress,
    lessonSet,
    nextQuestion
  });
}
export { createLearningPath };
