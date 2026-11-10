const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../dist');
const source = ['mail-data.js', 'announcement-data.js'].map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
const templates = vm.runInNewContext(source + ';EMAIL_TEMPLATES.filter(m => m.stage === "guide-update")');
for (const template of templates) {
  fs.writeFileSync(path.join(root, 'downloads', template.id + '.html'), template.html);
  fs.writeFileSync(path.join(root, 'downloads', template.id + '-subject.txt'), template.subject + '\n');
}
console.log('Built announcement emails:', templates.map(template => template.id).join(', '));
