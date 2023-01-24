import { mkdir, opendir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { syncElseThrow, templateToBody, throwError } from './helpers.js';

const buildSnippetsFromConfig = async (scopeUrl, dirent, fileName) => {
  const filePath = path.join(scopeUrl, dirent.name);

  const file = await readFile(filePath, {
    encoding: 'utf8',
  }).catch(throwError(`Unable to read file: ${filePath}`));

  const yaml = syncElseThrow(
    () => parse(file),
    `Yaml file is not correct: ${filePath}`
  );

  const { snippets, scope } = yaml;

  const snippetsObject = snippets.reduce((snippetsAcc, { name, prefix, template }) => {
    snippetsAcc[name] = {
      prefix,
      body: templateToBody(template),
      scope,
    };
    return snippetsAcc;
  }, {});

  const snippetsData = JSON.stringify(snippetsObject, null, 2);

  const outputSnippetsPath = fileURLToPath(
    new URL(`./../dist/${fileName}.code-snippets`, import.meta.url)
  );

  const outputDirectory = path.dirname(outputSnippetsPath);

  const dirPath = await mkdir(outputDirectory, {
    recursive: true,
  }).catch(throwError(`Failed to create directory: ${outputDirectory}`));

  if (dirPath) {
    console.log('A catalog has been created: ', dirPath);
  }

  await writeFile(outputSnippetsPath, snippetsData).catch(
    throwError(`Failed to create file: ${outputSnippetsPath}`)
  );
};

const build = async () => {
  const scopeUrl = fileURLToPath(new URL('./scope', import.meta.url));

  const dir = await opendir(scopeUrl, { encoding: 'utf8' }).catch(
    throwError(`Cannot find folder: ${scopeUrl}`)
  );

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
