/** Curriculum indexes are built once; task selection is O(1). */
const freeTask = {
  id: 'free',
  number: 0,
  title: 'Your Python playground',
  chapter: 'python',
  concept: 'Experiment with Python. Write small programs, test an idea, or solve an exercise your teacher gives you.',
  prompt: 'Run main.py to start your program. You can create helper files and import them. For input(), supply answers in Program input before running.',
  starter: '# Your own Python experiments\nfrom collections import deque\n\nqueue = deque(["Ana", "Ben"])\nqueue.append("Cid")\nprint("Next:", queue.popleft())\nprint("Waiting:", list(queue))\n',
  stdin: '',
  tests: [],
  hints: [],
  complexity: 'Trace a short example to see how variables change.',
  xp: 0
};
export function createCatalog(curriculum) {
  const { items, chapters } = curriculum;
  const byId = new Map();
  const chaptersById = new Map(chapters.map(chapter => [chapter.id, chapter]));
  const chapterItems = new Map(chapters.map(chapter => [chapter.id, []]));
  for (const item of items) {
    if (byId.has(item.id)) throw new Error('Duplicate mission: ' + item.id);
    if (!chapterItems.has(item.chapter)) throw new Error('Unknown mission chapter: ' + item.chapter);
    byId.set(item.id, item);
    chapterItems.get(item.chapter).push(item);
  }
  return Object.freeze({
    items,
    chapters,
    byId,
    chaptersById,
    chapterItems,
    freeTask
  });
}
