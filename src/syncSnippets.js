import { copyFile, opendir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { throwError } from './helpers.js';

const snippetsEndPath = 'Code/User/snippets';

const snippetsPathByPlatform = {
  win32: path.join(process.env.APPDATA, snippetsEndPath),
  linux: path.join(process.env.HOME, '.config', snippetsEndPath),
  darwin: path.join(
    process.env.HOME,
    'Library/Application Support',
    snippetsEndPath
  ),
};

const syncSnippets = async () => {
  const snippetsPath = snippetsPathByPlatform[process.platform];

  if (snippetsPath == null) {
    throw new Error(`${process.platform} platform is not supported`);
  }

  const distUrl = fileURLToPath(new URL('../dist', import.meta.url));

  const dir = await opendir(distUrl, { encoding: 'utf8' }).catch(
    throwError(`Cannot find folder: ${distUrl}`)
  );

  for await (const dirent of dir) {
    const { ext, base } = path.parse(dirent.name);

    if (ext !== '.code-snippets') {
      continue;
    }

    const sourceSnippetPath = path.join(distUrl, base);

    const destSnippetPath = path.join(snippetsPath, base);

    await copyFile(sourceSnippetPath, destSnippetPath)
      .then(() =>
        console.log(
          `Success copy file from '${sourceSnippetPath}' to '${destSnippetPath}'`
        )
      )
      .catch(
        throwError(
          `Failed to copy file from '${sourceSnippetPath}' to '${destSnippetPath}'`
        )
      );
  }
};

syncSnippets().catch(console.error);
