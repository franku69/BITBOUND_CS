"""Shared CPython runner and formative checker; used unchanged in Pyodide and tests.

Local student code is not a trusted assessment boundary. Worker termination is
managed outside Python. Outputs, trace events, and variable snapshots are bounded.
"""
import ast
import contextlib
import io
import json
import linecache
import math
import os
import reprlib
import sys
import traceback
import time
from functools import lru_cache

MAX_OUTPUT = 24000
MAX_TRACE = 180

class OutputLimitError(RuntimeError):
    pass

class BoundedOutput(io.StringIO):
    def __init__(self, emit=None):
        super().__init__()
        self.emit = emit
        self.pending = []
        self.pending_size = 0
        self.last_emit = -1.0

    def write(self, text):
        if self.tell() + len(text) > MAX_OUTPUT:
            super().write(text[:max(0, MAX_OUTPUT-self.tell())])
            self.flush()
            raise OutputLimitError('Output limit reached (24,000 characters). Check your loop or print less.')
        count = super().write(text)
        if self.emit and text:
            self.pending.append(text)
            self.pending_size += len(text)
            now = time.monotonic()
            if self.last_emit < 0 or now - self.last_emit >= 0.04 or self.pending_size >= 2048:
                self.flush()
        return count

    def flush(self):
        if self.emit and self.pending:
            self.emit(''.join(self.pending))
            self.pending.clear()
            self.pending_size = 0
            self.last_emit = time.monotonic()
        super().flush()

@lru_cache(maxsize=12)
def compiled(source, filename, mode='exec'):
    return compile(source, filename, mode)

@lru_cache(maxsize=8)
def parsed(source):
    return ast.parse(source, filename='main.py')

def compact(value):
    if type(value) not in (int, float, str, bool, list, dict, tuple, set, type(None)):
        return '<' + type(value).__name__ + '>'
    return reprlib.repr(value)[:180]

def structure_checks(source, rules):
    tree = parsed(source)
    nodes = list(ast.walk(tree))
    kinds = {type(node).__name__ for node in nodes}
    calls = {node.func.id for node in nodes if isinstance(node, ast.Call) and isinstance(node.func, ast.Name)}
    methods = {node.func.attr for node in nodes if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute)}
    messages = []
    for node in rules.get('nodes', []):
        if node not in kinds: messages.append('Use ' + node + ' as requested by this exercise.')
    if rules.get('anyNodes') and not kinds.intersection(rules['anyNodes']):
        messages.append('Use a loop or comprehension as requested.')
    for method in rules.get('methods', []):
        if method not in methods: messages.append('Practice the .' + method + '() method in this exercise.')
    for call in rules.get('calls', []):
        if call not in calls: messages.append('Use ' + call + '() as requested.')
    for name in rules.get('forbidMethods', []):
        if name in methods: messages.append('This exercise asks you to work without .' + name + '().')
    for name in rules.get('forbidCalls', []):
        if name in calls: messages.append('This exercise asks you to work without ' + name + '().')
    for name in rules.get('forbidNodes', []):
        if name in kinds: messages.append('Avoid ' + name + ' in this exercise; follow the requested algorithm.')
    recursive = rules.get('recursive')
    if recursive:
        functions = [n for n in nodes if isinstance(n, ast.FunctionDef) and n.name == recursive]
        if not any(isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id == recursive for f in functions for n in ast.walk(f)):
            messages.append('Call ' + recursive + '() from inside itself to practice recursion.')
    return messages

def reset_imports(file_names):
    # Workspaces contain flat .py files: indexed removal avoids scanning every
    # standard-library module on every test case.
    for filename in file_names:
        if filename.endswith('.py'):
            sys.modules.pop(filename[:-3], None)
    # Disable bytecode to avoid same-size files reusing stale compiled imports.
    sys.dont_write_bytecode = True


def normalized_output(value):
    return '\n'.join(line.rstrip() for line in str(value).replace('\r\n', '\n').splitlines()).strip()


def equal(actual, expected, required_type=None):
    if required_type == 'tuple':
        return isinstance(actual, tuple) and equal(list(actual), expected)
    if isinstance(expected, bool):
        return isinstance(actual, bool) and actual == expected
    if expected is None:
        return actual is None
    if isinstance(expected, (int, float)):
        return type(actual) in (int, float) and math.isclose(actual, expected, rel_tol=1e-9, abs_tol=1e-9)
    if isinstance(expected, list):
        return isinstance(actual, list) and len(actual) == len(expected) and all(equal(a, e) for a, e in zip(actual, expected))
    if isinstance(expected, dict):
        return isinstance(actual, dict) and actual.keys() == expected.keys() and all(equal(actual[k], v) for k,v in expected.items())
    return type(actual) is type(expected) and actual == expected


def execute(source, stdin='', prelude='', test=None, trace=False, file_names=(), emit=None):
    output, errors = BoundedOutput(emit), BoundedOutput()
    namespace = {'__name__': '__main__', '__file__': 'main.py'}
    frames = []
    old_stdin = sys.stdin
    reset_imports(file_names)
    linecache.cache['main.py'] = (len(source), None, source.splitlines(keepends=True), 'main.py')
    def tracer(frame, event, arg):
        if frame.f_code.co_filename == 'main.py' and event in ('line', 'return') and len(frames) < MAX_TRACE:
            values = {key: compact(value) for key, value in list(frame.f_locals.items())[:60] if not key.startswith('_') and not callable(value)}
            frames.append({'line': frame.f_lineno, 'event': event, 'function': frame.f_code.co_name, 'variables': values})
        return tracer
    result = {'stdout': '', 'stderr': '', 'error': None, 'trace': frames}
    try:
        sys.stdin = io.StringIO(stdin)
        with contextlib.redirect_stdout(output), contextlib.redirect_stderr(errors):
            if prelude: exec(compiled(prelude, '<exercise helpers>'), namespace)
            if trace: sys.settrace(tracer)
            exec(compiled(source, 'main.py'), namespace)
            sys.settrace(None)
            if test:
                if test.get('setup'): exec(compiled(test['setup'], '<test setup>'), namespace)
                if 'expression' in test:
                    actual = eval(compiled(test['expression'], '<test case>', 'eval'), namespace)
                    result['actual'] = compact(actual)
                    result['passed'] = equal(actual, test['expected'], test.get('type'))
                else:
                    result['actual'] = output.getvalue()[:1000]
                    result['passed'] = normalized_output(output.getvalue()) == normalized_output(test['stdout'])
    except BaseException as error:
        sys.settrace(None)
        result['error'] = ''.join(traceback.format_exception(type(error), error, error.__traceback__))[-7000:]
        result['passed'] = False
    finally:
        sys.settrace(None)
        sys.stdin = old_stdin
        output.flush()
        result['stdout'] = output.getvalue()
        result['stderr'] = errors.getvalue()
    return result


def handle_request(payload, emit=None):
    source = payload['files']['main.py']
    file_names = list(payload['files'])
    if payload['mode'] != 'check':
        return execute(source, payload.get('stdin', ''), trace=payload['mode']=='trace', file_names=file_names, emit=emit)
    task = payload['task']
    results = []
    try:
        messages = structure_checks(source, task.get('requires', {}))
    except SyntaxError:
        return execute(source, payload.get('stdin',''), file_names=file_names)
    for test in task['tests']:
        result = execute(source, test.get('stdin', ''), task.get('prelude',''), test, file_names=file_names)
        results.append({key:value for key,value in result.items() if key != 'trace'})
    return {'tests': results, 'guidance': messages, 'passed': not messages and all(r.get('passed') for r in results), 'stdout': '', 'stderr': '', 'error': None}
