import { NominalType } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import * as Utils from 'src/libs/utils';

export type FileName = NominalType<string, 'FileName'>; // represents a file with an extension and no path, eg `dir/file.ipynb` =>  `file.ipynb`
export type AbsolutePath = NominalType<string, 'AbsolutePath'>; // represents an absolute path in the context of a cloud storage directory structure, i.e. `dir/file.ipynb`
export type FileExtension = NominalType<string, 'Extension'>; // represents the substring found after the last dot in a file, eg `dir/file.txt.ipynb` => `ipynb`
export type DisplayName = NominalType<string, 'DisplayName'>; // represents the name of a file without an extension or pathing eg `dir/file.ipynb`=> `file`

// removes all paths up to and including the last slash, eg dir/file.ipynb` => `file.ipynb`
export const getFileName = (path: string): FileName => _.flow(_.split('/'), _.last)(path) as FileName;

export const getExtension = (path: string): FileExtension => _.flow(_.split('.'), _.last)(path) as FileExtension;

// ex abs/file.ipynb -> abs/file
export const stripExtension = (path: string): string => _.replace(/\.[^/.]+$/, '', path);

// removes leading dirs and a file ext suffix on paths eg `dir/file.ipynb`=> `file`
export const getDisplayName = (path: string): DisplayName => _.flow(getFileName, stripExtension)(path) as DisplayName;

export const notebookLockHash = (bucketName: string, email: string): Promise<string> =>
  Utils.sha256(`${bucketName}:${email}`);
