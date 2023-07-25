import fs from 'fs';
import path from 'path';
import process from 'process';

import ignore from 'ignore';

export default {
  '*.{js,ts}': (files) => {
    const cwd = process.cwd();
    const relativePaths = files.map((p) => path.relative(cwd, p));

    const eslintIgnore = ignore().add(fs.readFileSync('.eslintignore').toString())
    const filesToLint = eslintIgnore.filter(relativePaths)
    if (filesToLint.length === 0) {
      return []
    }

    return [`yarn eslint --max-warnings=0 ${filesToLint.join(' ')}`];
  },
};
