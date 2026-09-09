"""Authoritative exercise data. Run to regenerate app/curriculum.json."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
chapters=[
 ('python','Python base camp','print, input, variables, decisions, loops and functions','Sequence Specter'),
 ('lists','List caverns','Create, index, slice, append, extend, count and index','Operator Colossus'),
 ('methods','List workshop','Insert, pop, remove, reverse, sort and traversal','Index Warden'),
 ('collections','Collection forge','Tuples, dictionaries, sets and nested lists','Loop Titan'),
 ('algorithms','Algorithm citadel','Stacks, queues, linear search, binary search and sorting','Method Master'),
 ('linked','Linked pathways','Nodes, links, traversal and updates','Link Keeper'),
 ('recursion','Recursion tower','Base cases, call stacks and recursive solutions','Call Guardian'),
 ('graphs','Trees & graphs','Tree traversal, adjacency lists, BFS and DFS','Graph Guardian')]
items=[]
def add(title,concept,prompt,starter,solution,cases,hints,complexity,*,stdin='',prelude='',requires=None):
 i=len(items)+1
 tests=[]
 for n,c in enumerate(cases):
  if isinstance(c,dict): t=c
  else: t={'expression':c[0],'expected':c[1]}
  tests.append({'label':f'Case {n+1}',**t})
 items.append(dict(id=f'q{i:02}',chapter=chapters[(i-1)//6][0],number=i,title=title,concept=concept,prompt=prompt,starter=starter,solution=solution,tests=tests,hints=hints,complexity=complexity,stdin=stdin,prelude=prelude,requires=requires or {},xp=20 if i<=18 else 30 if i<=30 else 40))
add('Wake the terminal','print() sends text to the output panel. Text needs quotation marks.',
 'Print exactly Hello, BITBOUND! on one line. Run your code first, then choose Check challenge.',
 '# Put a message inside print()\n', 'print("Hello, BITBOUND!")',
 [{'stdout':'Hello, BITBOUND!\n'}],['Use print("your text").','Capital letters and punctuation matter here.'], 'One fixed message: O(1) time and space.')
add('Name your explorer','input() reads one line as text. Use + to join strings.',
 'Read one name with input() and print Welcome, followed by a space and the name. Do not put a prompt inside input(); the checker supplies the name.',
 'name = input()\n# Print the welcome message\n','name = input()\nprint("Welcome, " + name)',
 [{'stdin':'Ada\n','stdout':'Welcome, Ada\n'},{'stdin':'Juan dela Cruz\n','stdout':'Welcome, Juan dela Cruz\n'},{'stdin':'Mia\n','stdout':'Welcome, Mia\n'}],['The + operator joins two strings.','Use "Welcome, " including the final space.'],'O(n) time for a name of n characters.',stdin='Ada')
add('Potion calculator','int() converts input text to an integer. * means multiplication.',
 'Read a quantity on the first input line and a price on the second. Print their product, with no label.',
 'quantity = int(input())\nprice = int(input())\n# Calculate the total\n','quantity = int(input())\nprice = int(input())\nprint(quantity * price)',
 [{'stdin':'3\n25\n','stdout':'75\n'},{'stdin':'0\n10\n','stdout':'0\n'},{'stdin':'7\n12\n','stdout':'84\n'}],['Store quantity * price or print that expression directly.','Read both lines with int(input()).'],'O(1) operations for these small integers.',stdin='3\n25')
add('Open the gate','An if/else selects one path. Indent each branch by four spaces.',
 'Read an integer score. Print PASS when it is at least 75; otherwise print RETRY. Check the boundary score 75.',
 'score = int(input())\n# Write if / else below\n','score = int(input())\nif score >= 75:\n    print("PASS")\nelse:\n    print("RETRY")',
 [{'stdin':'75\n','stdout':'PASS\n'},{'stdin':'74\n','stdout':'RETRY\n'},{'stdin':'100\n','stdout':'PASS\n'},{'stdin':'0\n','stdout':'RETRY\n'}],['Use >= for at least.','if score >= 75: needs a colon and an indented next line.'],'O(1) time and space.',stdin='75',requires={'nodes':['If']})
add('Build a reusable tool','def names a function. A parameter receives a value. return sends the answer back to the caller.',
 'Complete double(number) so it returns twice the supplied number. Keep the function name and parameter. Print a sample call to see your answer when you Run.',
 'def double(number):\n    # Replace pass with your code\n    pass\n\nprint(double(4))\n','def double(number):\n    return number * 2\n\nprint(double(4))',
 [('double(4)',8),('double(0)',0),('double(-3)',-6),('double(2.5)',5.0)],['return is different from print: the checker needs the returned value.','Use return number * 2.'],'O(1) operations for these numbers.')
add('Charge the beacon','range(1, n + 1) visits 1 through n. A running total remembers the sum so far.',
 'Complete total_to(n). Use a loop to return 1 + 2 + ... + n. For n = 0, return 0. Inputs are non-negative integers.',
 'def total_to(n):\n    total = 0\n    # Add each number to total\n    return total\n\nprint(total_to(4))\n','def total_to(n):\n    total = 0\n    for number in range(1, n + 1):\n        total += number\n    return total\n\nprint(total_to(4))',
 [('total_to(4)',10),('total_to(0)',0),('total_to(1)',1),('total_to(10)',55)],['Inside the loop, update total with +=.','The stop of range is excluded, so use n + 1.'],'O(n) time, O(1) extra space.',requires={'anyNodes':['For','While']})
add('Pack an inventory','A list uses square brackets and keeps elements in order. Duplicates are allowed.',
 'Complete inventory(first, second, third). Return a list containing those three values in the same order.',
 'def inventory(first, second, third):\n    pass\n\nprint(inventory("potion", "key", "potion"))\n','def inventory(first, second, third):\n    return [first, second, third]',
 [('inventory("potion", "key", "potion")',['potion','key','potion']),('inventory(3, 2, 1)',[3,2,1]),('inventory("", 0, False)',['',0,False])],['Use [first, second, third].','Do not use a set; it would lose duplicates.'],'O(1) for exactly three items.')
add('First and last','Index 0 is first. Index -1 is last. An empty list has no valid index.',
 'Complete edges(items). Return [first_item, last_item]. If items is empty, return an empty list.',
 'def edges(items):\n    pass\n\nprint(edges([10, 20, 30]))\n','def edges(items):\n    if not items:\n        return []\n    return [items[0], items[-1]]',
 [('edges([10,20,30])',[10,30]),('edges([])',[]),('edges([7])',[7,7]),('edges([-2,0,9,4])',[-2,4])],['Check for an empty list before indexing.','Use items[0] and items[-1].'],'O(1) time and extra space.')
add('Slice a path','items[start:stop:step] includes start and excludes stop.',
 'Complete every_other(items). Return the elements at indexes 0, 2, 4, ... using slicing.',
 'def every_other(items):\n    pass\n\nprint(every_other([10, 20, 30, 40, 50]))\n','def every_other(items):\n    return items[::2]',
 [('every_other([10,20,30,40,50])',[10,30,50]),('every_other([])',[]),('every_other([1])',[1]),('every_other([1,2,3,4])',[1,3])],['An omitted start begins at index 0 for a positive step.','The step belongs after the second colon.'],'O(n) time and output space.',requires={'nodes':['Slice']})
add('Append one treasure','append(x) adds one object at the end and returns None. copy() makes a separate list.',
 'Complete add_one(items, value). Copy items, append value as ONE object, and return the copy. Do not change items; a list value must stay nested.',
 'def add_one(items, value):\n    result = items.copy()\n    # Append and return\n\nprint(add_one([1, 2], 3))\n','def add_one(items, value):\n    result = items.copy()\n    result.append(value)\n    return result',
 [('add_one([1,2],3)',[1,2,3]),('add_one([],7)',[7]),('add_one([1],[2,3])',[1,[2,3]]),{'setup':'original = [1,2]\nresult = add_one(original, 3)','expression':'[original, result]','expected':[[1,2],[1,2,3]]}],['Call result.append(value) on its own line.','Return result, not result.append(value).'],'O(n) copy; append is amortized O(1).',requires={'methods':['append']})
add('Extend the supplies','extend(other) adds each item from another iterable. It changes the list in place.',
 'Complete combine(left, right) using extend(). Return a new list of all left items followed by all right items. Leave both input lists unchanged.',
 'def combine(left, right):\n    result = left.copy()\n    pass\n\nprint(combine([1, 2], [3, 4]))\n','def combine(left, right):\n    result = left.copy()\n    result.extend(right)\n    return result',
 [('combine([1,2],[3,4])',[1,2,3,4]),('combine([],[])',[]),('combine([1],[1,1])',[1,1,1]),{'setup':'a=[1]\nb=[2]\nr=combine(a,b)','expression':'[a,b,r]','expected':[[1],[2],[1,2]]}],['Use extend rather than append to add individual items.','Copy left first.'],'O(n + m) time and output space.',requires={'methods':['extend']})
add('Count and locate','count(value) counts matches. index(value) finds the first position but raises ValueError if absent.',
 'Complete locate(items, target). Return [number_of_matches, first_index]. Use -1 for the index when target is absent. Use count() and index().',
 'def locate(items, target):\n    pass\n\nprint(locate([4, 7, 4], 4))\n','def locate(items, target):\n    count = items.count(target)\n    if count == 0:\n        return [0, -1]\n    return [count, items.index(target)]',
 [('locate([4,7,4],4)',[2,0]),('locate([1,2],9)',[0,-1]),('locate([],0)',[0,-1]),('locate([8,3,3],3)',[2,1])],['Find the count before calling index.','When count is zero, return [0, -1].'],'O(n) time, O(1) extra space.',requires={'methods':['count','index']})
add('Insert a checkpoint','insert(index, value) places an item before the current item at that index.',
 'Complete insert_copy(items, position, value). Return a copy with value inserted at position. Use Python insert() behavior, including out-of-range positions.',
 'def insert_copy(items, position, value):\n    pass\n\nprint(insert_copy([10, 30], 1, 20))\n','def insert_copy(items, position, value):\n    result = items.copy()\n    result.insert(position, value)\n    return result',
 [('insert_copy([10,30],1,20)',[10,20,30]),('insert_copy([],0,5)',[5]),('insert_copy([1,2],99,3)',[1,2,3]),{'setup':'a=[1,2]\nb=insert_copy(a,-1,7)','expression':'[a,b]','expected':[[1,2],[1,7,2]]}],['Copy first, then call insert.','Return the copy after the call.'],'O(n) time and output space.',requires={'methods':['insert']})
add('Pop a supply','pop(index) removes by position and returns the removed item. Default pop() removes the last item.',
 'Complete take(items, position). Return [removed_item, remaining_copy]. For an empty list return [None, []]. All positions supplied for nonempty lists are valid.',
 'def take(items, position):\n    pass\n\nprint(take([5, 8, 13], 1))\n','def take(items, position):\n    result = items.copy()\n    if not result:\n        return [None, []]\n    removed = result.pop(position)\n    return [removed, result]',
 [('take([5,8,13],1)',[8,[5,13]]),('take([],0)',[None,[]]),('take([1,2,3],-1)',[3,[1,2]]),{'setup':'a=[4,5]\nr=take(a,0)','expression':'[a,r]','expected':[[4,5],[4,[5]]]}],['Keep the value returned by pop.','Check if the copy is empty first.'],'O(n) including the copy and possible shifts.',requires={'methods':['pop']})
add('Remove one match','remove(value) deletes the first matching value. It does not remove all duplicates.',
 'Complete remove_first(items, target). Return a copy with the first target removed. If target is missing, return an unchanged copy.',
 'def remove_first(items, target):\n    pass\n\nprint(remove_first([2, 7, 2], 2))\n','def remove_first(items, target):\n    result = items.copy()\n    if target in result:\n        result.remove(target)\n    return result',
 [('remove_first([2,7,2],2)',[7,2]),('remove_first([1,2],9)',[1,2]),('remove_first([],4)',[]),{'setup':'a=[3,3]\nr=remove_first(a,3)','expression':'[a,r]','expected':[[3,3],[3]]}],['Use target in result before remove.','Only one matching item should disappear.'],'O(n) time and output space.',requires={'methods':['remove']})
add('Reverse the route','reverse() flips the current order. This is different from sorting.',
 'Complete flip(items) using reverse(). Return a reversed copy and leave items unchanged.',
 'def flip(items):\n    pass\n\nprint(flip([30, 10, 20]))\n','def flip(items):\n    result = items.copy()\n    result.reverse()\n    return result',
 [('flip([30,10,20])',[20,10,30]),('flip([])',[]),('flip([9])',[9]),{'setup':'a=[1,2]\nr=flip(a)','expression':'[a,r]','expected':[[1,2],[2,1]]}],['Make a copy, then reverse it.','reverse() returns None, so return the list separately.'],'O(n) time and output space.',requires={'methods':['reverse']})
add('Sort the crystals','sort() orders a list in place. sorted() creates a new sorted list.',
 'Complete ascending(items) using sort(). Return a sorted copy from smallest to largest. Preserve duplicates and leave items unchanged.',
 'def ascending(items):\n    pass\n\nprint(ascending([30, 10, 20]))\n','def ascending(items):\n    result = items.copy()\n    result.sort()\n    return result',
 [('ascending([30,10,20])',[10,20,30]),('ascending([])',[]),('ascending([3,-1,3,0])',[-1,0,3,3]),{'setup':'a=[2,1]\nr=ascending(a)','expression':'[a,r]','expected':[[2,1],[1,2]]}],['Do not return result.sort().','Copy the input and return the sorted copy.'],'O(n log n) worst-case sorting time; O(n) space with the copy.',requires={'methods':['sort']})
add('Map every index','enumerate(items) gives each index together with its element. Index and value are different.',
 'Complete index_map(items). Use a loop to return a list of [index, element] pairs for EVERY element, in order. Example: [8, 5] becomes [[0, 8], [1, 5]].',
 'def index_map(items):\n    result = []\n    # Visit every index and element\n    return result\n\nprint(index_map([2, 3, 5, 2, 33, 21]))\n','def index_map(items):\n    result = []\n    for index, value in enumerate(items):\n        result.append([index, value])\n    return result',
 [('index_map([2,3,5,2,33,21])',[[0,2],[1,3],[2,5],[3,2],[4,33],[5,21]]),('index_map([])',[]),('index_map([99])',[[0,99]])],['enumerate gives index, value at every step.','Append [index, value] to result.'],'O(n) time and output space.',requires={'anyNodes':['For','While','ListComp']})
add('Compute the team average','The mean is total divided by count. Dividing by zero causes an error.',
 'Complete average(scores). Return the mean as a number. Return None when scores is empty.',
 'def average(scores):\n    pass\n\nprint(average([85, 90, 78, 92, 85]))\n','def average(scores):\n    if not scores:\n        return None\n    return sum(scores) / len(scores)',
 [('average([85,90,78,92,85])',86.0),('average([])',None),('average([3])',3.0),('average([-2,2])',0.0)],['Check the empty case before dividing.','Use sum(scores) / len(scores).'],'O(n) time and O(1) extra space.')
add('Unpack a coordinate','A tuple groups values and cannot be changed in place. a, b = pair unpacks two values.',
 'Complete swap_coordinate(pair). Input is a tuple (x, y). Return a tuple (y, x), not a list.',
 'def swap_coordinate(pair):\n    pass\n\nprint(swap_coordinate((3, 7)))\n','def swap_coordinate(pair):\n    x, y = pair\n    return (y, x)',
 [{'expression':'swap_coordinate((3,7))','expected':[7,3],'type':'tuple'},{'expression':'swap_coordinate((0,-2))','expected':[-2,0],'type':'tuple'},{'expression':'swap_coordinate((5,5))','expected':[5,5],'type':'tuple'}],['Unpack x, y = pair.','Return (y, x).'],'O(1) time and extra space.')
add('Count the loot','A dictionary maps a key to a value. counts.get(key, 0) gives zero when a key is missing.',
 'Complete frequencies(items). Return a dictionary mapping each string to its number of occurrences.',
 'def frequencies(items):\n    counts = {}\n    pass\n\nprint(frequencies(["key", "gem", "key"]))\n','def frequencies(items):\n    counts = {}\n    for item in items:\n        counts[item] = counts.get(item, 0) + 1\n    return counts',
 [('frequencies(["key","gem","key"])',{'key':2,'gem':1}),('frequencies([])',{}),('frequencies(["a","a","a"])',{'a':3}),('frequencies(["B","b"])',{'B':1,'b':1})],['Loop through every item.','Update counts[item] using its previous count.'],'Expected O(n) time; O(k) space for k distinct keys.')
add('Keep the first copy','A set is useful for membership checks. A separate list can preserve first-seen order.',
 'Complete unique_ordered(items) for integers. Return each distinct value once, in the order it first appeared. Use a set to track seen values.',
 'def unique_ordered(items):\n    seen = set()\n    result = []\n    pass\n\nprint(unique_ordered([3, 1, 3, 2, 1]))\n','def unique_ordered(items):\n    seen = set()\n    result = []\n    for item in items:\n        if item not in seen:\n            seen.add(item)\n            result.append(item)\n    return result',
 [('unique_ordered([3,1,3,2,1])',[3,1,2]),('unique_ordered([])',[]),('unique_ordered([7,7])',[7]),('unique_ordered([-1,0,-1])',[-1,0])],['Append only if the item is not in seen.','Add the item to seen after accepting it.'],'Expected O(n) time and O(k) space.',requires={'calls':['set']})
add('Read the map rows','A nested list contains lists. Two loops can visit rows and then their cells.',
 'Complete row_totals(grid). Return one sum for each row. Rows may have different lengths, and an empty row has sum zero.',
 'def row_totals(grid):\n    pass\n\nprint(row_totals([[1, 2], [3], []]))\n','def row_totals(grid):\n    result = []\n    for row in grid:\n        result.append(sum(row))\n    return result',
 [('row_totals([[1,2],[3],[]])',[3,3,0]),('row_totals([])',[]),('row_totals([[-2,2],[4,5,6]])',[0,15])],['Visit rows in order.','sum(row) works on an empty row too.'],'O(c + r) time for c cells and r rows; O(r) output space.')
add('Filter the squad','Build a new list when filtering. Removing while traversing can skip values.',
 'Complete passing(scores). Return scores at least 75, in their original order. Leave the input unchanged.',
 'def passing(scores):\n    pass\n\nprint(passing([74, 75, 90, 60]))\n','def passing(scores):\n    result = []\n    for score in scores:\n        if score >= 75:\n            result.append(score)\n    return result',
 [('passing([74,75,90,60])',[75,90]),('passing([])',[]),('passing([75,75,100])',[75,75,100]),{'setup':'a=[60,80,50,90]\nr=passing(a)','expression':'[a,r]','expected':[[60,80,50,90],[80,90]]}],['Start with an empty result list.','Use >= 75, not > 75.'],'O(n) time and up to O(n) output space.')
add('Stack of supplies','A stack is last in, first out (LIFO). append pushes; pop removes the top.',
 'Complete stack_take(items, new_item). Copy items, push new_item, then pop the top. Return [popped_item, remaining_stack]. Use append() and pop().',
 'def stack_take(items, new_item):\n    pass\n\nprint(stack_take(["rope", "key"], "gem"))\n','def stack_take(items, new_item):\n    stack = items.copy()\n    stack.append(new_item)\n    top = stack.pop()\n    return [top, stack]',
 [('stack_take(["rope","key"],"gem")',['gem',['rope','key']]),('stack_take([],3)',[3,[]]),{'setup':'a=[1,2]\nr=stack_take(a,8)','expression':'[a,r]','expected':[[1,2],[8,[1,2]]]}],['The last item pushed must be the first popped.','Call pop() with no index.'],'O(n) for copying; each stack operation is amortized O(1).',requires={'methods':['append','pop']})
add('Queue at the portal','A queue is first in, first out (FIFO). collections.deque supports efficient operations at both ends.',
 'Complete serve(waiting, newcomer). Make a deque, append newcomer, and serve the front with popleft(). Return [served_person, remaining_as_list].',
 'from collections import deque\n\ndef serve(waiting, newcomer):\n    pass\n\nprint(serve(["Ana", "Ben"], "Cid"))\n','from collections import deque\n\ndef serve(waiting, newcomer):\n    queue = deque(waiting)\n    queue.append(newcomer)\n    served = queue.popleft()\n    return [served, list(queue)]',
 [('serve(["Ana","Ben"],"Cid")',['Ana',['Ben','Cid']]),('serve([],"Eli")',['Eli',[]]),('serve([1],2)',[1,[2]])],['deque(waiting) constructs the queue.','Use popleft(), not pop() or list.pop(0).'],'O(n) conversion; deque append and popleft are O(1).',requires={'methods':['popleft','append']})
add('Balance the shield','An opening parenthesis pushes onto a stack. A closing one must match a previous opening.',
 'Complete balanced(text) for text containing only ( and ). Return True when parentheses are balanced, otherwise False. Empty text is balanced. Use a stack.',
 'def balanced(text):\n    stack = []\n    pass\n\nprint(balanced("(())"))\n','def balanced(text):\n    stack = []\n    for char in text:\n        if char == "(":\n            stack.append(char)\n        elif not stack:\n            return False\n        else:\n            stack.pop()\n    return len(stack) == 0',
 [('balanced("(())()")',True),('balanced("")',True),('balanced(")(")',False),('balanced("(()")',False),('balanced("())")',False)],['A closing parenthesis with an empty stack is invalid.','At the end, no opening parenthesis should remain.'],'O(n) time and O(n) worst-case space.',requires={'methods':['append','pop']})
add('Search the tunnel','Linear search inspects items in order. Return immediately on the first match.',
 'Complete linear_search(items, target) with a loop. Return the first matching index, or -1 when absent. Do not use index().',
 'def linear_search(items, target):\n    pass\n\nprint(linear_search([8, 3, 8], 8))\n','def linear_search(items, target):\n    for index, value in enumerate(items):\n        if value == target:\n            return index\n    return -1',
 [('linear_search([8,3,8],8)',0),('linear_search([4,7,9],9)',2),('linear_search([],3)',-1),('linear_search([1,2],8)',-1)],['Keep return -1 after the loop, not inside it.','Use enumerate or a range of indexes.'],'O(n) worst-case time and O(1) extra space.',requires={'anyNodes':['For','While'],'forbidMethods':['index']})
add('Halve the search area','Binary search repeatedly halves a sorted search interval. It requires sorted input.',
 'Complete binary_search(items, target) for a sorted list of distinct integers. Use a while loop, low/high indexes, and a midpoint. Return the index or -1. Do not sort, use index(), or scan with in.',
 'def binary_search(items, target):\n    low = 0\n    high = len(items) - 1\n    pass\n\nprint(binary_search([2, 5, 8, 12, 16], 12))\n','def binary_search(items, target):\n    low = 0\n    high = len(items) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if items[mid] == target:\n            return mid\n        if items[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1',
 [('binary_search([2,5,8,12,16],12)',3),('binary_search([],7)',-1),('binary_search([3],3)',0),('binary_search([1,3,5,7],2)',-1),('binary_search(list(range(0,20000,2)),19998)',9999)],['Use // to calculate an integer midpoint.','Move past mid with +1 or -1 so the interval shrinks.'],'O(log n) time and O(1) extra space for the intended algorithm.',requires={'nodes':['While'],'forbidMethods':['index','sort'],'forbidCalls':['sorted'],'forbidNodes':['In']})
add('Forge selection sort','Selection sort finds the smallest remaining value and swaps it into the next position.',
 'Complete selection_sort(items). Return a sorted copy using selection sort and nested loops. Preserve duplicates. Do not use sort() or sorted().',
 'def selection_sort(items):\n    result = items.copy()\n    # Find the smallest remaining item and swap it\n    return result\n\nprint(selection_sort([5, 2, 4, 2]))\n','def selection_sort(items):\n    result = items.copy()\n    for i in range(len(result)):\n        smallest = i\n        for j in range(i + 1, len(result)):\n            if result[j] < result[smallest]:\n                smallest = j\n        result[i], result[smallest] = result[smallest], result[i]\n    return result',
 [('selection_sort([5,2,4,2])',[2,2,4,5]),('selection_sort([])',[]),('selection_sort([1])',[1]),('selection_sort([-1,5,0,-3])',[-3,-1,0,5]),{'setup':'a=[3,1,2]\nr=selection_sort(a)','expression':'[a,r]','expected':[[3,1,2],[1,2,3]]}],['Track the position of the smallest value.','Swap once per outer-loop iteration.'],'O(n²) time; O(n) space for the copy.',requires={'anyNodes':['For','While'],'forbidMethods':['sort'],'forbidCalls':['sorted']})
NODE='class Node:\n    def __init__(self, value, next=None):\n        self.value = value\n        self.next = next\n\n'
PRELUDE=NODE+'def chain(values):\n    head = None\n    for value in reversed(values):\n        head = Node(value, head)\n    return head\n\ndef values_of(head):\n    result = []\n    while head is not None:\n        result.append(head.value)\n        head = head.next\n    return result\n'
add('Follow the links','A linked-list node stores a value and a reference named next. None marks the end.',
 'Complete linked_values(head). Follow next references and return every value in order. The checker provides Node objects; None means an empty list.',
 NODE+'def linked_values(head):\n    pass\n\nprint(linked_values(Node(3, Node(7))))\n',NODE+'def linked_values(head):\n    result = []\n    current = head\n    while current is not None:\n        result.append(current.value)\n        current = current.next\n    return result',
 [('linked_values(chain([3,7,4]))',[3,7,4]),('linked_values(None)',[]),('linked_values(chain([8]))',[8])],['Use current = head to start.','Update current = current.next on every iteration.'],'O(n) time and output space.',prelude=PRELUDE)
add('Count the nodes','A linked list has no built-in index or length. Traverse to count its nodes.',
 'Complete linked_length(head). Return the number of nodes without creating a Python list.',
 NODE+'def linked_length(head):\n    pass\n',NODE+'def linked_length(head):\n    count = 0\n    while head is not None:\n        count += 1\n        head = head.next\n    return count',
 [('linked_length(chain([1,2,3]))',3),('linked_length(None)',0),('linked_length(chain([1]))',1)],['Start a count at zero.','Increment once per node and follow next.'],'O(n) time and O(1) extra space.',prelude=PRELUDE)
add('Add at the front','Prepending makes a new head whose next reference points to the old head.',
 'Complete prepend(head, value). Return a new Node at the front; keep the old nodes and their links.',
 NODE+'def prepend(head, value):\n    pass\n',NODE+'def prepend(head, value):\n    return Node(value, head)',
 [('values_of(prepend(chain([2,3]),1))',[1,2,3]),('values_of(prepend(None,9))',[9]),{'setup':'head=chain([4,5])\nnew=prepend(head,3)','expression':'new.next is head','expected':True}],['Node(value, head) points to the existing head.','Return the new Node.'],'O(1) time and extra space.',prelude=PRELUDE)
add('Append at the tail','Without a tail reference, appending requires walking to the last node.',
 'Complete append_node(head, value). Attach one new node at the end and return the head. For None, return the new node.',
 NODE+'def append_node(head, value):\n    pass\n',NODE+'def append_node(head, value):\n    if head is None:\n        return Node(value)\n    current = head\n    while current.next is not None:\n        current = current.next\n    current.next = Node(value)\n    return head',
 [('values_of(append_node(chain([1,2]),3))',[1,2,3]),('values_of(append_node(None,7))',[7]),{'setup':'h=chain([1])\nr=append_node(h,2)','expression':'r is h','expected':True}],['Handle the empty case first.','Stop when current.next is None, then attach a node.'],'O(n) time and O(1) extra space beyond the new node.',prelude=PRELUDE)
add('Find a linked value','Linked-list search follows references. Random access by index is not available.',
 'Complete linked_find(head, target). Return the zero-based position of the first matching value, or -1.',
 NODE+'def linked_find(head, target):\n    pass\n',NODE+'def linked_find(head, target):\n    index = 0\n    while head is not None:\n        if head.value == target:\n            return index\n        index += 1\n        head = head.next\n    return -1',
 [('linked_find(chain([4,8,4]),4)',0),('linked_find(chain([4,8,9]),9)',2),('linked_find(None,2)',-1),('linked_find(chain([1]),3)',-1)],['Count your position while following next.','Return -1 only after reaching the end.'],'O(n) time and O(1) extra space.',prelude=PRELUDE)
add('Reverse the links','Save the next reference before changing it, or you lose the rest of the chain.',
 'Complete reverse_links(head). Reverse next pointers in place and return the new head. Reuse the original nodes.',
 NODE+'def reverse_links(head):\n    previous = None\n    current = head\n    pass\n',NODE+'def reverse_links(head):\n    previous = None\n    current = head\n    while current is not None:\n        following = current.next\n        current.next = previous\n        previous = current\n        current = following\n    return previous',
 [('values_of(reverse_links(chain([1,2,3])))',[3,2,1]),('values_of(reverse_links(None))',[]),{'setup':'a=Node(1)\nb=Node(2)\na.next=b\nr=reverse_links(a)','expression':'r is b and b.next is a and a.next is None','expected':True}],['Remember following = current.next before rewiring.','Move previous and current one step forward.'],'O(n) time and O(1) extra space.',prelude=PRELUDE)
add('Find the base case','Recursion means a function calls itself. A base case stops further calls.',
 'Complete factorial(n) recursively for integers 0 through 12. Return n!; factorial(0) is 1.',
 'def factorial(n):\n    pass\n\nprint(factorial(5))\n','def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)',
 [('factorial(0)',1),('factorial(1)',1),('factorial(5)',120),('factorial(10)',3628800)],['Stop with 1 when n <= 1.','The recursive step is n * factorial(n - 1).'],'O(n) calls and O(n) call-stack space.',requires={'recursive':'factorial'})
add('Sum by recursion','An index parameter can shrink a problem without copying a list slice on every call.',
 'Complete recursive_sum(items, index=0). Return the sum from index to the end using recursion. Use indexes; do not slice or call sum().',
 'def recursive_sum(items, index=0):\n    pass\n\nprint(recursive_sum([2, 4, 6]))\n','def recursive_sum(items, index=0):\n    if index >= len(items):\n        return 0\n    return items[index] + recursive_sum(items, index + 1)',
 [('recursive_sum([2,4,6])',12),('recursive_sum([])',0),('recursive_sum([-2,2])',0),('recursive_sum([1,2,3],1)',5)],['Stop when index reaches the list length.','Add the current item to the result for index + 1.'],'O(n) time and call-stack space.',requires={'recursive':'recursive_sum','forbidCalls':['sum'],'forbidNodes':['Slice']})
add('Climb the Fibonacci steps','Naive Fibonacci repeats work. A dictionary can remember results from earlier calls.',
 'Complete fib(n, memo=None) recursively with a memo dictionary. fib(0)=0, fib(1)=1. Inputs are 0 through 30.',
 'def fib(n, memo=None):\n    if memo is None:\n        memo = {}\n    pass\n\nprint(fib(10))\n','def fib(n, memo=None):\n    if memo is None:\n        memo = {}\n    if n < 2:\n        return n\n    if n not in memo:\n        memo[n] = fib(n - 1, memo) + fib(n - 2, memo)\n    return memo[n]',
 [('fib(0)',0),('fib(1)',1),('fib(10)',55),('fib(30)',832040)],['Check memo before making more calls.','Store fib(n-1, memo) + fib(n-2, memo).'],'O(n) time and space with memoization.',requires={'recursive':'fib'})
add('Euclid’s shortcut','The greatest common divisor satisfies gcd(a, b) = gcd(b, a % b) until b is zero.',
 'Complete gcd(a, b) recursively for non-negative integers. Return a when b is zero, including gcd(0,0)=0 for this task.',
 'def gcd(a, b):\n    pass\n\nprint(gcd(48, 18))\n','def gcd(a, b):\n    if b == 0:\n        return a\n    return gcd(b, a % b)',
 [('gcd(48,18)',6),('gcd(7,0)',7),('gcd(0,9)',9),('gcd(0,0)',0),('gcd(17,13)',1)],['Check b == 0 before computing a remainder.','Pass b and a % b to the next call.'],'O(log(min(a,b))) recursive steps for positive inputs.',requires={'recursive':'gcd'})
add('Merge two routes','Merge compares the first unused values of two sorted lists, then appends the smaller.',
 'Complete merge(left, right) for sorted integer lists. Return their sorted combination using indexes. Preserve duplicates and inputs. Do not call sort() or sorted().',
 'def merge(left, right):\n    i = j = 0\n    result = []\n    pass\n\nprint(merge([1, 4], [2, 3]))\n','def merge(left, right):\n    i = j = 0\n    result = []\n    while i < len(left) and j < len(right):\n        if left[i] <= right[j]:\n            result.append(left[i])\n            i += 1\n        else:\n            result.append(right[j])\n            j += 1\n    result.extend(left[i:])\n    result.extend(right[j:])\n    return result',
 [('merge([1,4],[2,3])',[1,2,3,4]),('merge([],[])',[]),('merge([],[2,3])',[2,3]),('merge([1,1],[1,2])',[1,1,1,2]),{'setup':'a=[1,3]\nb=[2]\nr=merge(a,b)','expression':'[a,b,r]','expected':[[1,3],[2],[1,2,3]]}],['Continue while both lists still have unused elements.','Append the remainder after one side is exhausted.'],'O(n + m) time and output space.',requires={'forbidMethods':['sort'],'forbidCalls':['sorted']})
add('Divide, solve, merge','Merge sort divides a list, recursively sorts each half, then merges the sorted halves.',
 'Complete merge_sort(items) recursively. The supplied merge(left, right) helper is ready to use. Return a sorted list without changing the input. Do not use sort() or sorted().',
 'def merge(left, right):\n    result = []\n    i = j = 0\n    while i < len(left) and j < len(right):\n        if left[i] <= right[j]:\n            result.append(left[i]); i += 1\n        else:\n            result.append(right[j]); j += 1\n    return result + left[i:] + right[j:]\n\ndef merge_sort(items):\n    pass\n\nprint(merge_sort([5, 2, 4, 1]))\n',
 'def merge_sort(items):\n    if len(items) <= 1:\n        return items.copy()\n    mid = len(items) // 2\n    return merge(merge_sort(items[:mid]), merge_sort(items[mid:]))',
 [('merge_sort([5,2,4,1])',[1,2,4,5]),('merge_sort([])',[]),('merge_sort([3,-1,3])',[-1,3,3]),{'setup':'a=[2,1]\nr=merge_sort(a)','expression':'[a,r]','expected':[[2,1],[1,2]]}],['A list of zero or one item is already sorted.','Sort each half before passing them to merge.'],'O(n log n) time and O(n) peak auxiliary space.',requires={'recursive':'merge_sort','forbidMethods':['sort'],'forbidCalls':['sorted']})
# Keep the provided helper in the reference answer too.
items[-1]['solution']=items[-1]['starter'].split('def merge_sort')[0]+items[-1]['solution']
TREE='class TreeNode:\n    def __init__(self, value, left=None, right=None):\n        self.value = value\n        self.left = left\n        self.right = right\n\n'
TP=TREE+'def sample_tree():\n    return TreeNode(2, TreeNode(1), TreeNode(3, None, TreeNode(4)))\n'
add('Walk a tree in order','Inorder traversal visits left subtree, node, then right subtree. A missing child is None.',
 'Complete inorder(root) recursively. Return values in left-node-right order. TreeNode is provided in the starter.',
 TREE+'def inorder(root):\n    pass\n',TREE+'def inorder(root):\n    result = []\n    def visit(node):\n        if node is None:\n            return\n        visit(node.left)\n        result.append(node.value)\n        visit(node.right)\n    visit(root)\n    return result',
 [('inorder(sample_tree())',[1,2,3,4]),('inorder(None)',[]),('inorder(TreeNode(8))',[8]),('inorder(TreeNode(5,TreeNode(9)))',[9,5])],['Return immediately for a None node.','A helper can append into a shared result list.'],'O(n) time, O(h) call stack plus O(n) output for height h.',prelude=TP)
add('Measure tree height','For this task, height counts nodes on the longest root-to-leaf path. Empty height is zero.',
 'Complete height(root). An empty tree returns 0; a leaf returns 1. Use recursion.',
 TREE+'def height(root):\n    pass\n',TREE+'def height(root):\n    if root is None:\n        return 0\n    return 1 + max(height(root.left), height(root.right))',
 [('height(sample_tree())',3),('height(None)',0),('height(TreeNode(1))',1),('height(TreeNode(1,TreeNode(2,TreeNode(3))))',3)],['Find the height of each child.','Choose the larger child height and add one.'],'O(n) time and O(h) call-stack space.',prelude=TP,requires={'recursive':'height'})
add('Connect the map','An adjacency list maps each vertex to its neighbors. Undirected edges go both ways.',
 'Complete adjacency(edges). Input is a list of pairs of distinct string vertices, without duplicate edges. Return a dict of neighbor lists in insertion order. Include vertices appearing in edges.',
 'def adjacency(edges):\n    graph = {}\n    pass\n\nprint(adjacency([("A", "B"), ("B", "C")]))\n','def adjacency(edges):\n    graph = {}\n    for a, b in edges:\n        graph.setdefault(a, []).append(b)\n        graph.setdefault(b, []).append(a)\n    return graph',
 [('adjacency([("A","B"),("B","C")])',{'A':['B'],'B':['A','C'],'C':['B']}),('adjacency([])',{}),('adjacency([("X","Y")])',{'X':['Y'],'Y':['X']})],['Create an empty neighbor list when a key is new.','Append b under a and a under b.'],'O(V + E) time and space.')
add('Explore level by level','Breadth-first search (BFS) uses a queue. Mark a vertex seen when adding it to prevent repeated work.',
 'Complete bfs(graph, start). Return reachable vertices in BFS order, using the neighbor order in graph. Graph keys include all vertices. If start is absent, return []. Use deque.',
 'from collections import deque\n\ndef bfs(graph, start):\n    pass\n\nprint(bfs({"A": ["B"], "B": ["A"]}, "A"))\n','from collections import deque\n\ndef bfs(graph, start):\n    if start not in graph:\n        return []\n    seen = {start}\n    queue = deque([start])\n    result = []\n    while queue:\n        node = queue.popleft()\n        result.append(node)\n        for neighbor in graph[node]:\n            if neighbor not in seen:\n                seen.add(neighbor)\n                queue.append(neighbor)\n    return result',
 [('bfs({"A":["B","C"],"B":["A","D"],"C":["D"],"D":[]},"A")',['A','B','C','D']),('bfs({},"A")',[]),('bfs({"A":["A"],"B":[]},"A")',['A']),('bfs({"A":[],"B":[]},"A")',['A'])],['Use popleft for FIFO order.','Mark seen before queue.append, not after processing.'],'O(V + E) time and O(V) auxiliary space for reachable vertices.',requires={'methods':['popleft']})
add('Explore one path deeply','Depth-first search (DFS) follows a branch before backtracking. A seen set handles cycles.',
 'Complete dfs(graph, start) recursively. Return vertices in preorder, visiting neighbors in listed order. Return [] when start is absent. All neighbors are graph keys.',
 'def dfs(graph, start):\n    pass\n\nprint(dfs({"A": ["B"], "B": []}, "A"))\n','def dfs(graph, start):\n    if start not in graph:\n        return []\n    seen = set()\n    result = []\n    def visit(node):\n        if node in seen:\n            return\n        seen.add(node)\n        result.append(node)\n        for neighbor in graph[node]:\n            visit(neighbor)\n    visit(start)\n    return result',
 [('dfs({"A":["B","C"],"B":["D"],"C":[],"D":["A"]},"A")',['A','B','D','C']),('dfs({},"A")',[]),('dfs({"A":["A"]},"A")',['A'])],['Define a visit helper with shared seen and result.','Add the vertex before recursively visiting neighbors.'],'O(V + E) time and O(V) auxiliary space for reachable vertices.')
add('Find the shortest route','In an unweighted graph, BFS reaches vertices in order of edge distance from the start.',
 'Complete distance(graph, start, goal). Return the fewest edges from start to goal, or -1 if unreachable or either vertex is absent. Return 0 when start equals goal and exists. Use BFS.',
 'from collections import deque\n\ndef distance(graph, start, goal):\n    pass\n\nprint(distance({"A": ["B"], "B": []}, "A", "B"))\n','from collections import deque\n\ndef distance(graph, start, goal):\n    if start not in graph or goal not in graph:\n        return -1\n    queue = deque([(start, 0)])\n    seen = {start}\n    while queue:\n        node, depth = queue.popleft()\n        if node == goal:\n            return depth\n        for neighbor in graph[node]:\n            if neighbor not in seen:\n                seen.add(neighbor)\n                queue.append((neighbor, depth + 1))\n    return -1',
 [('distance({"A":["B","C"],"B":["D"],"C":["D"],"D":[]},"A","D")',2),('distance({"A":[]},"A","A")',0),('distance({"A":[],"B":[]},"A","B")',-1),('distance({},"A","A")',-1),('distance({"A":["B"],"B":["A"]},"A","B")',1)],['Put (vertex, distance) pairs in the queue.','The first time you remove goal from the queue is its shortest distance.'],'O(V + E) time and O(V) auxiliary space.',requires={'methods':['popleft']})
assert len(items)==48
out={'version':1,'chapters':[dict(id=a,title=b,summary=c,boss=d) for a,b,c,d in chapters],'items':items}
(ROOT/'app/curriculum.json').write_text(json.dumps(out,indent=2,ensure_ascii=False))
print(f'{len(items)} exercises, {sum(len(x["tests"]) for x in items)} test cases')
