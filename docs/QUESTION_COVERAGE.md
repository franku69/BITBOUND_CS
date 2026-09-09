# Trail question coverage — v23

All 268 questions are required along a fresh eight-world campaign. Questions are fixed in world and teaching order. Mob sets contain up to four items from one stage; fixed sentries cover all remaining items. Shrine placement and all 48 coding tasks are unchanged.

## World learning paths

| World | Stage | Lessons | Context |
|---|---|---:|---|
| 1 · STONEWAKE VALLEY | 1 · First words | 1–10 | Stonewake’s trail beacons need clear messages. Start with names, text, input and conversion before changing their signals. |
| 1 · STONEWAKE VALLEY | 2 · Decisions on the trail | 11–22 | A fork in the valley opens only when its condition is true. Read expressions first, then follow one branch. |
| 1 · STONEWAKE VALLEY | 3 · Repeat with a purpose | 23–29 | The beacon patrol repeats its route. Track one iteration, then the stopping rule, before tracing nested loops. |
| 1 · STONEWAKE VALLEY | 4 · Small reliable programs | 30–40 | Give the beacons reusable instructions. Follow arguments and returns, then diagnose names, scope and invalid input. |
| 2 · THORNVEIL FOREST | 1 · Pack and count | 1–9 | The company needs a supply list in Thornveil. Learn where an item lives before changing or searching the pack. |
| 2 · THORNVEIL FOREST | 2 · Change the supplies | 10–20 | Add supplies, remove used items and take slices. Notice which methods change the list and which return a value. |
| 2 · THORNVEIL FOREST | 3 · Share without surprises | 21–26 | Two companions may be holding the same list. Compare aliases, copies and independent rows before estimating access cost. |
| 2 · THORNVEIL FOREST | 4 · Build and preserve records | 27–32 | Filter a new supply list, then use tuples for fixed records. A tuple can still refer to a mutable list. |
| 3 · EMBERGLOW CAVERNS | 1 · Prepare the workbench | 1–12 | Emberglow’s workshop trays are out of order. Review list updates, iteration and their cost before writing a sorting pass. |
| 3 · EMBERGLOW CAVERNS | 2 · Bubble Sort | 13–18 | Neighbouring tray labels can trade places. Trace one pass, keep its bounds safe, then explain stability and early exit. |
| 3 · EMBERGLOW CAVERNS | 3 · Insertion Sort | 19–24 | Keep one sorted tray and insert the next label into it. Save the key before shifting items and test nearly sorted input. |
| 3 · EMBERGLOW CAVERNS | 4 · Selection Sort and comparison | 25–32 | Select the smallest remaining label for each position. Compare swaps, comparisons, stability and Python’s key-based sorting. |
| 4 · OATHFORGE KEEP | 1 · Unique gate permits | 1–8 | At Oathforge, use the loops, list operations and functions learned on the road to repair the Castellan’s records. Oathforge’s gate accepts each permit once. Use sets to track membership and combine groups of permitted travellers. |
| 4 · OATHFORGE KEEP | 2 · Named workshop records | 9–20 | At Oathforge, use the loops, list operations and functions learned on the road to repair the Castellan’s records. The Castellan guards records indexed by names. Read and update dictionaries, handle missing keys and choose hashable keys. |
| 4 · OATHFORGE KEEP | 3 · Reuse the workshop instructions | 21–26 | At Oathforge, use the loops, list operations and functions learned on the road to repair the Castellan’s records. Split the keep’s repair instructions into modules and functions. Then examine default arguments and lazy iteration. |
| 4 · OATHFORGE KEEP | 4 · Objects and recovery | 27–32 | At Oathforge, use the loops, list operations and functions learned on the road to repair the Castellan’s records. Model separate gate devices with instances. Recover from bad input and close files correctly before confronting their guardian. |
| 5 · IRONQUEUE CATACOMBS | 1 · Undo a wrong turn | 1–8 | The catacombs repeat their corridors. A stack remembers the latest turn first: push, pop, undo and bracket matching. |
| 5 · IRONQUEUE CATACOMBS | 2 · Serve in arrival order | 9–15 | The old prison’s service bells form a queue. Follow FIFO, use deque efficiently, then distinguish a priority queue. |
| 5 · IRONQUEUE CATACOMBS | 3 · Find the missing route | 16–24 | Search the corridor register one entry at a time. Only after confirming sorted order should you discard half a search range. |
| 5 · IRONQUEUE CATACOMBS | 4 · Choose a search strategy | 25–32 | Compare search tradeoffs with the sorting ideas from Emberglow. Finish by choosing a stack or queue for an actual route task. |
| 6 · VEYRFALL • CASTLE APPROACH | 1 · Follow the chain | 1–10 | The castle approach is a broken chain of watch posts. A node stores a value and a link; walk the links to count or search. |
| 6 · VEYRFALL • CASTLE APPROACH | 2 · Repair the links | 11–21 | Reconnect the drawbridge messages. Insert and delete carefully, including an empty chain and the final node. |
| 6 · VEYRFALL • CASTLE APPROACH | 3 · Reverse and detect loops | 22–27 | The old escape route runs backwards and one branch loops. Preserve the next link while reversing; use slow and fast pointers for cycles. |
| 6 · VEYRFALL • CASTLE APPROACH | 4 · Compare route structures | 28–32 | At the outer gate, compare sentinels, two-way links and sorted chains. Decide when an indexed array makes repeated searches easier. |
| 7 · VEYRFALL • INNER KEEP | 1 · Return from each room | 1–10 | The inner keep repeats smaller versions of its halls. Find a base case, make progress, return to the caller and reuse repeated answers. |
| 7 · VEYRFALL • INNER KEEP | 2 · Read a branching floor plan | 11–16 | A corridor branches into rooms without circling back: a rooted tree. Identify leaves, edges and height before choosing an order. |
| 7 · VEYRFALL • INNER KEEP | 3 · Visit every room | 17–24 | Preorder, inorder, postorder and level order visit the same rooms differently. Trace the walk before comparing its cost. |
| 7 · VEYRFALL • INNER KEEP | 4 · Keep the keys searchable | 25–32 | The keep orders keys in a BST. Search, insert and remove them, then see why an unbalanced tree can become a chain. |
| 8 · VEYRFALL • THRONE HALL | 1 · Balance the throne locks | 1–8 | The throne passage uses height-balanced search trees. Start with the BST rule and balance factors before attempting a repair. |
| 8 · VEYRFALL • THRONE HALL | 2 · Rebalance after insertion | 9–17 | A new key can lean a subtree left or right. Identify LL, RR, LR or RL before performing the matching rotation. |
| 8 · VEYRFALL • THRONE HALL | 3 · Preserve and repair the tree | 18–29 | Every rotation must preserve all links and update heights. Deletion may shrink a subtree and require another repair above it. |
| 8 · VEYRFALL • THRONE HALL | 4 · Break the connected seals | 30–36 | Beyond the tree locks, the king’s barrier connects rooms into a graph. Use visited sets, DFS and BFS; distinguish weighted paths. |

## Topic coverage

An item may have multiple coverage tags. Every tagged item appears in its world path, rather than choosing one representative per topic.

| Topic | Questions | Worlds |
|---|---:|---|
| algorithm analysis | 5 | 5 |
| avl tree | 28 | 8 |
| binary search | 3 | 5 |
| binary search implementation | 4 | 5, 6 |
| binary search tradeoffs | 4 | 5, 6 |
| binary search tree | 9 | 7 |
| bubble sort | 7 | 3 |
| dictionaries | 13 | 4 |
| graphs | 8 | 8 |
| insertion sort | 7 | 3 |
| linear search | 5 | 5, 6 |
| linear search implementation | 3 | 5, 6 |
| linked list methods | 29 | 6 |
| list basics | 40 | 2, 3 |
| python fundamentals | 53 | 1, 3, 4 |
| queue application | 3 | 5, 7 |
| queue definition | 3 | 5 |
| queue implementation | 3 | 5 |
| rebalancing trees | 28 | 8 |
| recursion | 12 | 5, 7 |
| selection sort | 7 | 3 |
| sets | 8 | 4 |
| singly linked list | 30 | 5, 6 |
| stack application | 5 | 5 |
| stack definition | 2 | 5 |
| stack list implementation | 4 | 5 |
| tree structure | 6 | 7 |
| tree traversal | 9 | 5, 7 |
| tuples | 7 | 2, 4 |
