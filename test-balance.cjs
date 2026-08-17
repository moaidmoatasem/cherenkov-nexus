const fs = require('fs');
const content = fs.readFileSync('src/components/JobSynthesizer.tsx', 'utf8');

let depth = 0;
const lines = content.split('\n');
let syntesizedSection = false;
let startDepth = 0;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // very rudimentary depth counting
    const opens = (line.match(/<div/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    depth += opens - closes;
    
    if (line.includes('{synthesizedData ? (')) {
        syntesizedSection = true;
        startDepth = depth;
        console.log(`Line ${i}: synthesizedData ? ( - depth ${depth}`);
    }
    
    if (syntesizedSection && line.includes(') : (')) {
        console.log(`Line ${i}: ) : ( - depth ${depth}, expected: ${startDepth}`);
        syntesizedSection = false;
    }
}
