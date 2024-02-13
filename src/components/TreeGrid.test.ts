import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { RowContents, TreeGrid } from 'src/components/TreeGrid';
import { SnapshotBuilderConcept } from 'src/libs/ajax/DataRepo';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

type Node = RowContents & {
  name: string;
};

const initialHierarchy = new Map<number, SnapshotBuilderConcept[]>();
// to show root, we need a domainOptionRoot that points to it
const domainOptionRoot: Node = { id: 0, name: 'Point to Root', hasChildren: true };
const root: Node = { id: 1, name: 'root', hasChildren: true };
const child1: Node = { id: 2, name: 'child1', hasChildren: false };
const child2: Node = { id: 3, name: 'child2', hasChildren: true };
const child3: Node = { id: 4, name: 'child3', hasChildren: false };

const testConcepts = [
  { id: 0, name: 'Point to Root', hasChildren: true },
  { id: 1, name: 'root', hasChildren: true },
  { id: 2, name: 'child1', hasChildren: false },
  { id: 3, name: 'child2', hasChildren: true },
  { id: 4, name: 'child3', hasChildren: false },
];
const testHierarchy = [
  { id: 0, concept: domainOptionRoot, children: [1] },
  { id: 1, concept: root, children: [2, 3], parent: 0 },
  { id: 2, concept: child1, children: [], parent: 1 },
  { id: 3, concept: child2, children: [4], parent: 1 },
  { id: 4, concept: child3, children: [], parent: 3 },
];
const domainOptionRootChildren = [child1, child2];
initialHierarchy.set(domainOptionRoot.id, [root]);
initialHierarchy.set(root.id, domainOptionRootChildren);

const col2 = (node: Node) => `${node.name}_2`;
const col3 = (node: Node) => `${node.name}_3`;

const columns = [
  { name: 'name', width: 100, render: _.get('name') },
  { name: 'col2', width: 100, render: col2 },
  { name: 'col3', width: 100, render: col3 },
];

describe('TreeGrid', () => {
  let getChildrenCount;
  const renderTree = () => {
    getChildrenCount = 0;
    render(
      TreeGrid({
        columns,
        initialHierarchy,
        getChildren: async (node) => {
          getChildrenCount++;
          const id = node.id;
          const parent = _.find({ id }, testHierarchy)!;
          const children = parent.children;
          return _.map((childID) => _.find({ id: childID }, testConcepts) as Node, children);
        },
        domainOptionRoot,
      })
    );
  };

  it('renders a tree, header and root visible, children not hidden', () => {
    // Arrange
    renderTree();
    // Assert
    // All column names are visible in the header.
    _.map(_.flow(_.get('name'), (name) => expect(screen.queryByText(name)).toBeTruthy()))(columns);
    // The root and its columns are visible.
    expect(screen.queryByText(root.name)).toBeTruthy();
    expect(screen.queryByText(col2(root))).toBeTruthy();
    expect(screen.queryByText(col3(root))).toBeTruthy();
    // The children are initially not visible.
    expect(screen.queryByText(child1.name)).toBeTruthy();
    expect(screen.queryByText(child2.name)).toBeTruthy();
  });

  it('renders a tree, children not visible after collapse', async () => {
    // Arrange
    renderTree();

    // Act
    const user = userEvent.setup();
    // Click the expand button.
    await user.click(screen.getByLabelText(`collapse ${root.id}`));
    // Assert
    // The children are now visible.
    expect(screen.queryByText(child1.name)).toBeFalsy();
    expect(screen.queryByText(child2.name)).toBeFalsy();
  });

  it('renders a tree, children visible again after collapse and expand', async () => {
    // Arrange
    renderTree();

    // Act
    const user = userEvent.setup();
    await user.click(screen.getByLabelText(`collapse ${root.id}`));
    await user.click(screen.getByLabelText(`expand ${root.id}`));

    // Assert
    // The children are no longer visible.
    expect(screen.queryByText(child1.name)).toBeTruthy();
    expect(screen.queryByText(child2.name)).toBeTruthy();
  });

  it('renders a tree, second call to expand uses cached values', async () => {
    // Arrange
    renderTree();

    // Act
    const user = userEvent.setup();

    // expand
    await user.click(screen.getByLabelText(`expand ${child2.id}`));

    // collapse
    await user.click(screen.getByLabelText(`collapse ${child2.id}`));

    // expand
    await user.click(screen.getByLabelText(`expand ${child2.id}`));

    // Assert
    // Expanded twice, but only one call to getChildren because child is already fetched.
    expect(getChildrenCount).toBe(1);
  });
});
