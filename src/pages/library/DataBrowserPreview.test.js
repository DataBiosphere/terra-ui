import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { formatTableCell } from 'src/pages/library/DataBrowserPreview';
import { describe, expect, it } from 'vitest';

describe('DataBrowserPreview', () => {
  const testJsonButton = async (cellContent, cellContentTransformation = (cellContent) => cellContent) => {
    // Arrange
    let clicked = false;
    const user = userEvent.setup();
    // Act
    const { getByText } = render(
      formatTableCell({
        cellKey: 'string',
        cellContent,
        rowIndex: 0,
        table: 'table',
        setViewJSON: (args) => {
          clicked = args;
        },
      })
    );
    const jsonButton = getByText('View JSON');
    await user.click(jsonButton);
    // Assert
    expect(getByText('View JSON')).toBeTruthy();
    expect(clicked).toStrictEqual({
      cellData: cellContentTransformation(cellContent),
      title: 'table, Row 0 - string',
    });
  };

  it('renders json as view json clickable button', async () => {
    // Arrange
    const cellContent = '{"key": "value"}';
    // Act & Assert
    await testJsonButton(cellContent, (cellContent) => JSON.parse(cellContent));
  });

  it('renders object as view json clickable button', async () => {
    const cellContent = { key: 'value' };
    // Act & Assert
    await testJsonButton(cellContent);
  });

  it('renders array as view json', async () => {
    // Arrange
    const cellContent = ['a', 'b', 'c'];
    // Act & Assert
    await testJsonButton(cellContent);
  });

  it('renders numbers as number', () => {
    // Arrange
    const cellContent = 1;
    // Act
    const { getByText } = render(formatTableCell({ cellKey: 'string', cellContent, rowIndex: 0, table: 'table', setViewJSON: () => {} }));
    // Assert
    expect(getByText(cellContent.toString())).toBeTruthy();
  });

  it('renders non number, non object as toString version', () => {
    // Arrange
    const cellContent = 'abc';
    // Act
    const { getByText } = render(formatTableCell({ cellKey: 'string', cellContent, rowIndex: 0, table: 'table', setViewJSON: () => {} }));
    // Assert
    expect(getByText(cellContent)).toBeTruthy();
  });
});
