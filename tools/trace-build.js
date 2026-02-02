const fs = require('fs');
const path = require('path');

const origReadFileSync = fs.readFileSync.bind(fs);
const origReadFile = fs.readFile.bind(fs);

fs.readFileSync = function(p, ...args) {
  try {
    const pp = String(p);
    if (pp.endsWith('.json')) console.error('READ_JSON_SYNC:', pp);
  } catch (e) {}
  return origReadFileSync(p, ...args);
};

fs.readFile = function(p, ...args) {
  try {
    const pp = String(p);
    if (pp.endsWith('.json')) console.error('READ_JSON_ASYNC:', pp);
  } catch (e) {}
  return origReadFile(p, ...args);
};

process.on('uncaughtException', (e) => {
  console.error('UNCAUGHT_EXCEPTION', e && (e.stack || e));
  process.exit(1);
});

process.on('unhandledRejection', (e) => {
  console.error('UNHANDLED_REJECTION', e && (e.stack || e));
  process.exit(1);
});

// Run the CRA build script
require('react-scripts/scripts/build');
