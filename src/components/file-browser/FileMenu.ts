import { Fragment } from 'react';
import { h } from 'react-hyperscript-helpers';
import { Clickable } from 'src/components/common';
import { basename } from 'src/components/file-browser/file-browser-utils';
import { icon } from 'src/components/icons';
import { MenuButton } from 'src/components/MenuButton';
import { makeMenuIcon, MenuTrigger } from 'src/components/PopupTrigger';
import { FileBrowserFile } from 'src/libs/ajax/file-browser-providers/FileBrowserProvider';

type FileMenuProps = {
  file: FileBrowserFile;
  onRename: (file: FileBrowserFile) => void;
};

const FileMenuContent = (props: FileMenuProps) => {
  const { file, onRename } = props;
  return h(Fragment, [
    h(
      MenuButton,
      {
        tooltipSide: 'left',
        onClick: () => {
          onRename(file);
        },
      },
      [makeMenuIcon('renameIcon'), 'Rename']
    ),
  ]);
};

export const FileMenu = (props: FileMenuProps) => {
  const { file } = props;

  return h(
    MenuTrigger,
    {
      closeOnClick: true,
      content: h(FileMenuContent, props),
    },
    [
      h(
        Clickable,
        {
          'aria-label': `Action menu for file: ${basename(file.path)}`,
          'aria-haspopup': 'menu',
          style: { opacity: 0.65 },
          hover: { opacity: 1 },
        },
        [icon('cardMenuIcon')]
      ),
    ]
  );
};
