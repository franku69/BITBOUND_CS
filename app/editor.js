/** A real CodeMirror editor, loaded once. The native textarea remains a usable fallback. */
let vendorReady;
const vendorRoot = new URL('../vendor/codemirror/', import.meta.url);
function loadScript(path) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL(path,vendorRoot).href;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Enhanced editor could not load. The plain editor is still available.'));
    document.head.append(script);
  });
}
function loadVendor() {
  if (!vendorReady) vendorReady = (async () => {
    await loadScript('codemirror-python.bundle.js');
    return window.CodeMirror;
  })();
  return vendorReady;
}
const keywords = 'False None True and as assert break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield print input int float str bool list dict set tuple range enumerate len sum min max sorted reversed zip abs round any all open'.split(' ');
export class PythonEditor {
  constructor(textarea, onChange, onNotice) {
    this.textarea=textarea;
    this.onChange=onChange;
    this.muted=false;
    this.cm=null;
    this.traceLine=null;
    textarea.addEventListener('input',()=>{if(!this.cm) onChange(this.getValue());});
    textarea.addEventListener('keydown',event=>{
      if(event.key==='Tab' && !this.cm){event.preventDefault(); this.insert('    ');}
      if(event.key==='Escape') textarea.blur();
    });
    loadVendor().then(CM=>{
      this.cm = CM.fromTextArea(textarea, {
        mode:'python', lineNumbers:true, indentUnit:4, tabSize:4, indentWithTabs:false,
        lineWrapping:false, matchBrackets:true, autoCloseBrackets:true, viewportMargin:12,
        inputStyle:'textarea', screenReaderLabel:'Python source code editor',
        extraKeys:{
          Tab: cm=>cm.somethingSelected()?cm.indentSelection('add'):cm.replaceSelection('    ','end','+input'),
          'Shift-Tab':cm=>cm.indentSelection('subtract'),
          'Ctrl-Space':()=>this.complete(), 'Cmd-Space':()=>this.complete(),
          'Ctrl-/':cm=>cm.toggleComment(), 'Cmd-/':cm=>cm.toggleComment(),
          Escape:cm=>cm.getInputField().blur(),
          'Ctrl-Enter':()=>document.getElementById('runBtn').click(),
          'Cmd-Enter':()=>document.getElementById('runBtn').click(),
          'Ctrl-S':()=>document.getElementById('downloadCode').click(),
          'Cmd-S':()=>document.getElementById('downloadCode').click()
        }
      });
      for(const [key,value] of Object.entries({autocapitalize:'off',autocorrect:'off',autocomplete:'off',spellcheck:'false'})) this.cm.getInputField().setAttribute(key,value);
      this.cm.on('change',()=>{if(!this.muted)onChange(this.getValue());});
      this.cm.on('cursorActivity',()=>{
        const cursor=this.cm.getCursor();
        document.getElementById('cursorPosition').textContent=`Ln ${cursor.line+1}, Col ${cursor.ch+1}`;
      });
      this.refresh();
    }).catch(error=>onNotice(error.message));
  }
  getValue(){return this.cm ? this.cm.getValue() : this.textarea.value;}
  setValue(value){this.muted=true; if(this.cm){this.cm.setValue(value);this.cm.clearHistory();}else this.textarea.value=value;this.muted=false;this.clearTrace();}
  insert(value){if(this.cm){this.cm.replaceSelection(value,'end','+input');this.cm.focus();}else {const t=this.textarea; t.setRangeText(value,t.selectionStart,t.selectionEnd,'end');t.focus();this.onChange(t.value);}}
  indent(){if(this.cm)this.cm.indentSelection('add');else this.insert('    ');}
  outdent(){if(this.cm)this.cm.indentSelection('subtract');}
  command(name){if(this.cm){this.cm.execCommand(name);this.cm.focus();}}
  complete(){
    if(!this.cm)return;
    const CM=window.CodeMirror;
    this.cm.showHint({completeSingle:false,hint:cm=>{
      const cursor=cm.getCursor(),line=cm.getLine(cursor.line);
      const match=line.slice(0,cursor.ch).match(/[A-Za-z_][A-Za-z0-9_]*$/);
      const prefix=match?match[0]:'';
      const names = new Set([...keywords,...(cm.getValue().slice(0,60000).match(/[A-Za-z_][A-Za-z0-9_]*/g)||[])]);
      return {list:[...names].filter(word=>word.startsWith(prefix)&&word!==prefix).sort().slice(0,50),from:CM.Pos(cursor.line,cursor.ch-prefix.length),to:cursor};
    }});
  }
  clearTrace(){if(this.cm&&this.traceLine!==null)this.cm.removeLineClass(this.traceLine,'background','trace-highlight');this.traceLine=null;}
  highlight(line){this.clearTrace();if(this.cm){this.traceLine=Math.max(0,line-1);this.cm.addLineClass(this.traceLine,'background','trace-highlight');this.cm.scrollIntoView({line:this.traceLine,ch:0},50);}}
  refresh(){setTimeout(()=>this.cm?.refresh(),0);}
}
