import {mkdir, copyFile} from 'node:fs/promises';
await mkdir('dist', {recursive:true});
for (const file of ['index.html','styles.css','app.js','quiz-content.js','admin.html','admin.js','admin.css']) {
  await copyFile(file, `dist/${file}`);
}
