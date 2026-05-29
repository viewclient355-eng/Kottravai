/**
 * Validates and repairs Google Private Key format for JWT authentication.
 * Handles:
 * - Quoted keys from .env
 * - Escaped newlines (\n)
 * - Missing or malformed BEGIN/END markers
 * - Whitespace normalization
 */

function validateAndRepairKey(rawKey) {
  console.log('[KEY_VALIDATOR] Input length:', rawKey ? rawKey.length : 0);
  console.log('[KEY_VALIDATOR] Input first char code:', rawKey ? rawKey.charCodeAt(0) : 'N/A');
  console.log('[KEY_VALIDATOR] Input last char code:', rawKey && rawKey.length > 0 ? rawKey.charCodeAt(rawKey.length - 1) : 'N/A');

  if (!rawKey) {
    throw new Error('Private key is empty or undefined');
  }

  let key = String(rawKey).trim();
  console.log('[KEY_VALIDATOR] After trim, first char:', key.charAt(0), 'last char:', key.charAt(key.length - 1));

  // Step 1: Remove leading quote
  if (key.charAt(0) === '"' || key.charAt(0) === "'") {
    key = key.slice(1);
    console.log('[KEY_VALIDATOR] Removed leading quote');
  }

  // Step 2: Remove trailing comma, quote, and other junk that .env might add
  while (key.length > 0 && (key.charAt(key.length - 1) === '"' || 
         key.charAt(key.length - 1) === "'" || 
         key.charAt(key.length - 1) === ',' ||
         key.charAt(key.length - 1) === ';' ||
         key.match(/\s$/))) {
    key = key.slice(0, -1).trim();
    console.log('[KEY_VALIDATOR] Removed trailing junk, new length:', key.length);
  }

  // Step 3: Replace escaped newlines with actual newlines
  if (key.includes('\\n')) {
    key = key.replace(/\\n/g, '\n');
    console.log('[KEY_VALIDATOR] Replaced escaped newlines with actual newlines');
  }

  // Step 4: Normalize whitespace (remove extra spaces/tabs at line ends)
  key = key
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
  console.log('[KEY_VALIDATOR] Normalized whitespace and filtered empty lines');

  // Step 5: Validate BEGIN/END markers
  const hasBegin = key.includes('BEGIN PRIVATE KEY');
  const hasEnd = key.includes('END PRIVATE KEY');

  if (!hasBegin || !hasEnd) {
    console.error('[KEY_VALIDATOR] ❌ Missing PEM markers!');
    console.error('[KEY_VALIDATOR] Has BEGIN:', hasBegin);
    console.error('[KEY_VALIDATOR] Has END:', hasEnd);
    console.error('[KEY_VALIDATOR] First 100 chars:', key.substring(0, 100));
    console.error('[KEY_VALIDATOR] Last 100 chars:', key.substring(Math.max(0, key.length - 100)));
    throw new Error('Private key missing BEGIN/END markers');
  }

  console.log('[KEY_VALIDATOR] ✅ Key structure valid');
  console.log('[KEY_VALIDATOR] Final key length:', key.length);
  console.log('[KEY_VALIDATOR] Line count:', key.split('\n').length);

  return key;
}

module.exports = { validateAndRepairKey };
