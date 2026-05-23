const { Pool } = require('pg');

function autoFix(connStr) {
    if (connStr.includes(':') && connStr.split('@').length > 2) {
        const protocolPart = connStr.split('://')[0];
        const remaining = connStr.split('://')[1];
        const lastAtIndex = remaining.lastIndexOf('@');
        const credentials = remaining.substring(0, lastAtIndex);
        const hostPart = remaining.substring(lastAtIndex + 1);
        
        if (credentials.includes(':')) {
            const [user, ...pwdParts] = credentials.split(':');
            const password = pwdParts.join(':');
            const encodedPassword = encodeURIComponent(password);
            return `${protocolPart}://${user}:${encodedPassword}@${hostPart}`;
        }
    }
    return connStr;
}

const test1 = "postgres://user:p@ssword@host:5432/db";
console.log("Test 1:", test1, "->", autoFix(test1));

const test2 = "postgres://user:p@ss:word@host:5432/db";
console.log("Test 2:", test2, "->", autoFix(test2));

const test3 = "postgres://user:pass@host:5432/db";
console.log("Test 3:", test3, "->", autoFix(test3));

const test4 = "postgres://user:p@ss@word@host:5432/db";
console.log("Test 4:", test4, "->", autoFix(test4));
