import { mkdir, opendir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { syncElseThrow, templateToBody } from './helpers.js';
import { DIST_URL } from './constants.js';

const buildSnippetsFromConfig = async (scopeUrl, dirent, fileName) => {
  const filePath = path.join(scopeUrl, dirent.name);

  const file = await readFile(filePath, { encoding: 'utf8' });

  const yaml = syncElseThrow(
    () => parse(file),
    `Yaml file is not correct: ${filePath}`
  );

  const { snippets, scope } = yaml;

  const snippetsObject = snippets.reduce(
    (snippetsAcc, { name, prefix, template }) => {
      snippetsAcc[name] = {
        prefix,
        body: templateToBody(template),
        scope,
      };
      return snippetsAcc;
    },
    {}
  );

  const snippetsData = JSON.stringify(snippetsObject, null, 2).concat('\n');

  const outputSnippetsPath = fileURLToPath(
    new URL(`${fileName}.code-snippets`, DIST_URL)
  );

  const outputDirectory = path.dirname(outputSnippetsPath);

  await mkdir(outputDirectory, { recursive: true });

  await writeFile(outputSnippetsPath, snippetsData);
};

const build = async () => {
  const scopeUrl = fileURLToPath(new URL('./scope', import.meta.url));

  const dir = await opendir(scopeUrl, { encoding: 'utf8' });

  await rm(DIST_URL, { force: true, recursive: true });

  for await (const dirent of dir) {
    const { ext, name } = path.parse(dirent.name);

    if (ext !== '.yaml') {
      continue;
    }

    await buildSnippetsFromConfig(scopeUrl, dirent, name).catch(console.error);
  }
};

build()
  .then(() => console.log('Snippets created'))
  .catch(console.error);
