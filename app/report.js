import {download} from './storage.js?v=8749b2c7cc4b';
export const escapeHtml = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function exportTeacherReport(state, items) {
  const completed=items.filter(item=>state.completed[item.id]);
  const rows=items.map(item=>{
    const result=state.completed[item.id];
    return `<tr><td>${item.number}. ${escapeHtml(item.title)}</td><td>${result?'Passed':'In progress / not checked'}</td><td>${state.attempts[item.id]||0}</td><td>${state.practiceSolution[item.id]?'Yes':'No'}</td></tr>`;
  }).join('');
  const code=completed.map(item=>`<section><h2>${item.number}. ${escapeHtml(item.title)}</h2><p>Passed: ${escapeHtml(state.completed[item.id].at)}. Solution viewed before passing: ${state.completed[item.id].solutionViewed?'Yes':'No'}.</p><pre>${escapeHtml(state.completed[item.id].code || '(No submitted-code snapshot in this imported record.)')}</pre></section>`).join('');
  const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BITBOUND practice report</title><style>body{font:16px/1.6 system-ui;max-width:900px;margin:30px auto;padding:16px;color:#142238}table{border-collapse:collapse;width:100%;font-size:14px}th,td{border:1px solid #bdc9d4;text-align:left;padding:8px}th{background:#eaf1f7}pre{white-space:pre-wrap;overflow-wrap:anywhere;padding:16px;background:#edf3f8;font:14px/1.6 monospace}section{break-inside:avoid}button{padding:12px}@media print{button{display:none}body{margin:0}}</style><h1>BITBOUND · Python practice report</h1><p><b>Student:</b> ${escapeHtml(state.name || 'Not entered')}<br><b>Exported:</b> ${escapeHtml(new Date().toISOString())}<br><b>Completed:</b> ${completed.length} / ${items.length}</p><p>This is a self-reported practice record exported manually from the student’s session. It is editable and is not proof of independent work. Ask the student to explain and modify a solution in class.</p><button onclick="window.print()">Print / save PDF</button><table><thead><tr><th>Mission</th><th>Result</th><th>Checks attempted</th><th>Solution viewed</th></tr></thead><tbody>${rows}</tbody></table><h1>main.py saved when each mission passed</h1>${code}</html>`;
  download('BITBOUND_Practice_Report.html',html,'text/html;charset=utf-8');
}
