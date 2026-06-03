const fs = require('fs');
const path = require('path');

function inject(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            inject(fullPath);
        } else if (fullPath.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            content = content.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/g, '');
            const depth = fullPath.includes('pages') ? '../' : './';
            const injection = '<script src="' + depth + 'js/dexie.js"></script>\n    <script src="' + depth + 'js/mobile-api.js"></script>\n';
            if (content.includes('</head>')) {
                content = content.replace('</head>', injection + '</head>');
            } else {
                content = content.replace('<body>', '<body>\n' + injection);
            }
            fs.writeFileSync(fullPath, content);
            console.log('Injected into ' + file);
        }
    }
}
inject('./www');
