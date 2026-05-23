const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\santh\\OneDrive - WisRight Technologies Private Limited\\Pictures\\Kottravai-main (1)\\Kottravai-main\\src\\pages\\admin\\AdminDashboard.tsx', 'utf8');

function checkBalance(str) {
    let stack = [];
    let lines = str.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        for (let j = 0; j < line.length; j++) {
            let char = line[j];
            if (char === '{' || char === '(' || char === '[') {
                stack.push({ char, line: i + 1, col: j + 1 });
            } else if (char === '}' || char === ')' || char === ']') {
                if (stack.length === 0) {
                    console.log(`Extra ${char} at line ${i + 1}, col ${j + 1}`);
                    continue;
                }
                let last = stack.pop();
                if ((char === '}' && last.char !== '{') ||
                    (char === ')' && last.char !== '(') ||
                    (char === ']' && last.char !== '[')) {
                    console.log(`Mismatched ${char} at line ${i + 1}, col ${j + 1} (expected closing for ${last.char} from line ${last.line})`);
                }
            }
        }
    }
    if (stack.length > 0) {
        stack.forEach(s => console.log(`Unclosed ${s.char} from line ${s.line}, col ${s.col}`));
    } else {
        console.log("Braces are balanced!");
    }
}

// Simple tag balancer (very crude)
function checkTags(str) {
    let tags = [];
    let regex = /<\/?([a-zA-Z0-9]+)/g;
    let match;
    let lines = str.split('\n');
    
    // We need to account for self-closing tags and strings/comments, but let's try a simple one first.
    // Actually, let's just focus on the errors reported.
}

checkBalance(content);
