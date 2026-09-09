"""Independently execute trace questions and validate tree-rotation examples."""
import json,subprocess,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
qs=json.loads((root/'adventure/encounter-questions.json').read_text())['items']
assert len(qs)==268 and len({q['id'] for q in qs})==268
for w in range(8):assert sum(q['world']==w for q in qs)>=32
required={'python-fundamentals','list-basics','bubble-sort','insertion-sort','selection-sort','tuples','sets','dictionaries','recursion','stack-definition','stack-application','stack-list-implementation','queue-definition','queue-application','singly-linked-list','linked-list-methods','linear-search','linear-search-implementation','binary-search','binary-search-implementation','binary-search-tradeoffs','tree-structure','tree-traversal','binary-search-tree','avl-tree','rebalancing-trees'}
for tag in required:
 assert sum(tag in q.get('coverage',[]) for q in qs)>=2,tag
assert all(q['world']==7 for q in qs if 'avl-tree' in q.get('coverage',[]))
traces=0
for q in qs:
 assert q['prompt'] and q['explanation'] and len(set(q['choices']))==3
 assert 0<=q['answer']<3 and 0<=q['world']<8
 if q['trace']:
  result=subprocess.run([sys.executable,'-I','-c',q['code']],capture_output=True,text=True,timeout=2)
  assert result.returncode==0,(q['id'],result.stderr)
  assert result.stdout.rstrip('\n')==q['choices'][q['answer']],(q['id'],result.stdout)
  traces+=1
# Reference AVL insertion uses actual links and computed heights, independently
# checking the four question sequences and preserved inorder traversal.
class Node:
 def __init__(self,key):self.key=key;self.left=self.right=None

def height(n):return 0 if n is None else 1+max(height(n.left),height(n.right))
def balance(n):return height(n.left)-height(n.right)
def rotate_right(y):
 x=y.left;y.left=x.right;x.right=y;return x

def rotate_left(x):
 y=x.right;x.right=y.left;y.left=x;return y

def rebalance(n):
 if balance(n)>1:
  if balance(n.left)<0:n.left=rotate_left(n.left)
  return rotate_right(n)
 if balance(n)<-1:
  if balance(n.right)>0:n.right=rotate_right(n.right)
  return rotate_left(n)
 return n

def insert(n,k):
 if n is None:return Node(k)
 if k<n.key:n.left=insert(n.left,k)
 elif k>n.key:n.right=insert(n.right,k)
 return rebalance(n)

def inorder(n):return [] if n is None else inorder(n.left)+[n.key]+inorder(n.right)
def valid(n):return n is None or abs(balance(n))<=1 and valid(n.left) and valid(n.right)
for keys in [[30,20,10],[10,20,30],[30,10,20],[10,30,20]]:
 tree=None
 for k in keys:tree=insert(tree,k)
 assert tree.key==20 and inorder(tree)==[10,20,30] and valid(tree)
# Deletion zero-child-balance case: after deleting 5 from [4,2,5,1,3].
tree=None
for k in [4,2,5,1,3]:tree=insert(tree,k)
tree.right=None
assert balance(tree)==2 and balance(tree.left)==0
tree=rebalance(tree)
assert tree.key==2 and inorder(tree)==[1,2,3,4] and valid(tree)
print(f'PASS {len(qs)} authored encounter questions, {traces} executed Python traces, four AVL rotations and deletion boundary case.')
