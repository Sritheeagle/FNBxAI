const fs = require('fs');
const path = require('path');
const trace = fs.readFileSync(path.join(__dirname,'..','trace-build.txt'),'utf8');
const lines = trace.split(/\r?\n/);
const jsonPaths = new Set();
for (const l of lines) {
  const m = l.match(/READ_JSON_(?:SYNC|ASYNC):\s*(.*)$/);
  if (m) jsonPaths.add(m[1].trim());
}
console.log('Checked JSON files from trace:', jsonPaths.size);
let failures = 0;
for (const p of jsonPaths) {
  if (!fs.existsSync(p)) continue;
  try {
    const content = fs.readFileSync(p,'utf8');
    JSON.parse(content);
  } catch (err) {
    // only report actual JSON parse errors
    if (err && err.name === 'SyntaxError') {
      console.error('PARSE_ERROR', p, err.message);
      failures++;
      if (failures >= 20) break;
    }
  }
}
if (failures === 0) console.log('No parse errors found in traced JSON files.');
else console.log('Total parse errors (up to 10 shown):', failures);
process.exit(failures>0?1:0);
