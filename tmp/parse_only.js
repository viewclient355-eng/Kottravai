const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'Checkout-main.tsx');
const sourceText = fs.readFileSync(file, 'utf8');
const ts = require('typescript');
const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TSX);
const diagnostics = sourceFile.parseDiagnostics;
for (const diag of diagnostics) {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(diag.start || 0);
  const message = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
  console.log(`${line + 1}:${character + 1} - ${message}`);
}
console.log('parse diagnostics count', diagnostics.length);
