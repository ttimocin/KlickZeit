const fs = require('fs');
try {
    console.log(fs.readFileSync('SHA1_output.txt', 'utf16le'));
} catch (e) {
    console.error(e);
}
