import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { CreateDataset } from 'src/pages/library/data-catalog/CreateDataset/CreateDataset';

type NavExports = typeof import('src/libs/nav');
jest.mock(
  'src/libs/nav',
  (): Partial<NavExports> => ({
    getCurrentUrl: jest.fn().mockReturnValue(new URL('https://app.terra.bio')),
    getLink: jest.fn(),
    goToPath: jest.fn(),
  })
);

describe('CreateDataset', () => {
  it('Prepopulates storage system', async () => {
    // Act
    render(
      h(CreateDataset, {
        storageSystem: 'wks',
        storageSourceId: '',
      })
    );
    // Assert
    expect(await screen.queryAllByText('Workspace').length).toBe(1);
  });

  it('Validates storage system', async () => {
    // Act
    render(h(CreateDataset));
    // Assert
    expect(await screen.queryAllByText("Storage system can't be blank").length).toBe(1);
  });

  it('Prepopulates storage source id', async () => {
    // Act
    render(
      h(CreateDataset, {
        storageSystem: 'ext',
        storageSourceId: 'blahblah',
      })
    );
    // Assert
    expect(await screen.queryAllByText("Storage source id can't be blank").length).toBe(0);
  });

  it('Validates storage source id', async () => {
    // Act
    render(h(CreateDataset));
    // Assert
    expect(await screen.queryAllByText("Storage source id can't be blank").length).toBe(2);
  });

  it('Validates for title', async () => {
    const user = userEvent.setup();

    render(
      h(CreateDataset, {
        storageSystem: 'wks',
        storageSourceId: 'abcdef',
      })
    );
    expect(await screen.queryAllByText("Dct:title can't be blank").length).toBe(1);
    const titleInput = screen.getByLabelText('Title *');
    await user.type(titleInput, 'title');
    expect(await screen.queryByText("Dct:title can't be blank")).toBeFalsy();
    await user.clear(titleInput);
    // Count increases because we show the red error message after title has been touched
    expect(await screen.queryAllByText("Dct:title can't be blank").length).toBe(2);
  });

  // No description test due to label bug with markdown input

  it('Validates for accessURL', async () => {
    const user = userEvent.setup();

    render(
      h(CreateDataset, {
        storageSystem: 'wks',
        storageSourceId: 'abcdef',
      })
    );
    expect(await screen.queryAllByText("Dcat:access url can't be blank").length).toBe(1);
    // One extra for the publication list
    expect(await screen.queryAllByText('Dcat:access url is not a valid url').length).toBe(2);
    const accessURLInput = screen.getByLabelText('Access URL *');
    await user.type(accessURLInput, 'title');
    expect(await screen.queryByText("Dcat:access url can't be blank")).toBeFalsy();
    expect(await screen.queryAllByText('Dcat:access url is not a valid url').length).toBe(3);
    await user.clear(accessURLInput);
    await user.type(accessURLInput, 'https://url.com');
    expect(await screen.queryAllByText('Dcat:access url is not a valid url').length).toBe(1);
    await user.clear(accessURLInput);
    // Count increases because we show the red error message after access URL has been touched
    expect(await screen.queryAllByText("Dcat:access url can't be blank").length).toBe(2);
  });

  it('Validates for creator', async () => {
    const user = userEvent.setup();

    render(
      h(CreateDataset, {
        storageSystem: 'wks',
        storageSourceId: 'abcdef',
      })
    );
    expect(await screen.queryAllByText("Dct:creator can't be blank").length).toBe(1);
    const creatorInput = screen.getByLabelText('Dataset Creator *');
    await user.type(creatorInput, 'creator');
    expect(await screen.queryByText("Dct:creator can't be blank")).toBeFalsy();
    await user.clear(creatorInput);
    // Count increases because we show the red error message after creator has been touched
    expect(await screen.queryAllByText("Dct:creator can't be blank").length).toBe(2);
  });
});
