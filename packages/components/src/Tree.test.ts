import { render, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';

import { Tree, TreeItemModel } from './Tree';

describe('Tree', () => {
  const rootItem: TreeItemModel<string> = {
    label: 'root',
    data: '',
    children: [
      {
        label: 'a',
        data: 'a',
        children: [
          {
            label: 'a1',
            data: 'a1',
          },
          {
            label: 'a2',
            data: 'a2',
          },
        ],
      },
      {
        label: 'b',
        data: 'b',
      },
    ],
  };

  it('renders tree', () => {
    // Act
    render(
      h(Tree, {
        id: 'test-tree',
        label: 'Test tree',
        isItemSelected: () => false,
        rootItem,
        onClickItem: () => {
          /* noop */
        },
      })
    );

    // Assert
    ['root', 'a', 'a1', 'a2', 'b'].forEach((itemName) => {
      screen.getByText(itemName);
    });

    const getTreeItemChildren = (name: string) => {
      const treeItem = screen.getByText(name);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const childListItems = Array.from(treeItem.parentElement!.querySelector('ul')!.children);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return childListItems.map((el) => el.querySelector('a')!.textContent);
    };

    expect(getTreeItemChildren('root')).toEqual(['a', 'b']);
    expect(getTreeItemChildren('a')).toEqual(['a1', 'a2']);
  });
});
