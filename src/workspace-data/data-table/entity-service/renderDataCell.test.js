import { render } from '@testing-library/react';
import _ from 'lodash/fp';
import * as Utils from 'src/libs/utils';

import { renderDataCell } from './renderDataCell';

describe('renderDataCell', () => {
  const testGoogleWorkspace = { workspace: { bucketName: 'test-bucket', cloudPlatform: 'Gcp' } };
  const testAzureWorkspace = {
    workspace: { bucketName: 'test-bucket', cloudPlatform: 'Azure', workspaceId: '77397ce7-bb9b-4339-bc12-95e1f52956de' },
  };
  describe('basic data types', () => {
    it.each([{ testWorkspace: testGoogleWorkspace }, { testWorkspace: testAzureWorkspace }])('renders strings', ({ testWorkspace }) => {
      expect(render(renderDataCell('abc', testWorkspace)).container).toHaveTextContent('abc');
      expect(render(renderDataCell({ items: ['a', 'b', 'c'], itemsType: 'AttributeValue' }, testWorkspace)).container).toHaveTextContent('a,b,c');
    });

    it.each([{ testWorkspace: testGoogleWorkspace }, { testWorkspace: testAzureWorkspace }])('renders numbers', ({ testWorkspace }) => {
      expect(render(renderDataCell(42, testWorkspace)).container).toHaveTextContent('42');
      expect(render(renderDataCell({ items: [1, 2, 3], itemsType: 'AttributeValue' }, testWorkspace)).container).toHaveTextContent('1,2,3');
    });

    it.each([{ testWorkspace: testGoogleWorkspace }, { testWorkspace: testAzureWorkspace }])('renders booleans', ({ testWorkspace }) => {
      expect(render(renderDataCell(true, testWorkspace)).container).toHaveTextContent('true');
      expect(render(renderDataCell(false, testWorkspace)).container).toHaveTextContent('false');
      expect(render(renderDataCell({ items: [true, false], itemsType: 'AttributeValue' }, testWorkspace)).container).toHaveTextContent('true,false');
    });

    it('renders entity name for references', () => {
      expect(render(renderDataCell({ entityType: 'thing', entityName: 'thing_one' }, testGoogleWorkspace)).container).toHaveTextContent('thing_one');
      expect(
        render(
          renderDataCell(
            {
              items: [
                { entityType: 'thing', entityName: 'thing_one' },
                { entityType: 'thing', entityName: 'thing_two' },
              ],
              itemsType: 'EntityReference',
            },
            testGoogleWorkspace
          )
        ).container
      ).toHaveTextContent('thing_one,thing_two');
    });
  });

  it.each([{ testWorkspace: testGoogleWorkspace }, { testWorkspace: testAzureWorkspace }])('renders empty lists', ({ testWorkspace }) => {
    expect(render(renderDataCell({ items: [], itemsType: 'AttributeValue' }, testWorkspace)).container).toHaveTextContent('');
  });

  it.each([{ testWorkspace: testGoogleWorkspace }, { testWorkspace: testAzureWorkspace }])(
    'limits the number of list items rendered',
    ({ testWorkspace }) => {
      expect(
        render(
          renderDataCell(
            {
              items: _.map(_.toString, _.range(0, 1000)),
              itemsType: 'AttributeValue',
            },
            testWorkspace
          )
        ).container
      ).toHaveTextContent(_.flow(_.map(_.toString), Utils.append('and 900 more'), _.join(','))(_.range(0, 100)));
    }
  );

  it.each([{ testWorkspace: testGoogleWorkspace }, { testWorkspace: testAzureWorkspace }])('renders missing values', ({ testWorkspace }) => {
    expect(render(renderDataCell(undefined, testWorkspace)).container).toHaveTextContent('');
  });

  describe('JSON values', () => {
    it.each([{ testWorkspace: testGoogleWorkspace }, { testWorkspace: testAzureWorkspace }])(
      'renders each item of arrays containing basic data types',
      ({ testWorkspace }) => {
        expect(render(renderDataCell(['one', 'two', 'three'], testWorkspace)).container).toHaveTextContent('one,two,three');
      }
    );

    it.each([{ testWorkspace: testGoogleWorkspace }, { testWorkspace: testAzureWorkspace }])(
      'renders JSON for arrays of objects',
      ({ testWorkspace }) => {
        expect(render(renderDataCell([{ key1: 'value1' }, { key2: 'value2' }, { key3: 'value3' }], testWorkspace)).container).toHaveTextContent(
          '[ { "key1": "value1" }, { "key2": "value2" }, { "key3": "value3" } ]'
        );
      }
    );

    it.each([{ testWorkspace: testGoogleWorkspace }, { testWorkspace: testAzureWorkspace }])('renders empty arrays', ({ testWorkspace }) => {
      expect(render(renderDataCell([], testWorkspace)).container).toHaveTextContent('');
    });

    it.each([{ testWorkspace: testGoogleWorkspace }, { testWorkspace: testAzureWorkspace }])('renders JSON for other values', ({ testWorkspace }) => {
      expect(render(renderDataCell({ key: 'value' }, testWorkspace)).container).toHaveTextContent('{ "key": "value" }');
    });
  });

  describe('URLs', () => {
    it('renders links to GCS URLs', () => {
      const { container, getByRole } = render(renderDataCell('gs://bucket/file.txt', testGoogleWorkspace));
      expect(container).toHaveTextContent('file.txt');
      const link = getByRole('link');
      expect(link).toHaveAttribute('href', 'gs://bucket/file.txt');
    });

    it('renders a warning for GCS URLs outside the workspace bucket', () => {
      const { getByText } = render(renderDataCell('gs://other-bucket/file.txt', testGoogleWorkspace));
      expect(getByText('Some files are located outside of the current workspace')).toBeTruthy();
    });

    it('does not render a warning for GCS URLs in the workspace bucket', () => {
      const { queryByText } = render(renderDataCell('gs://test-bucket/file.txt', testGoogleWorkspace));
      expect(queryByText('Some files are located outside of the current workspace')).toBeNull();
    });

    it('renders a warning for Azure URLs outside the workspace storage', () => {
      const { getByText } = render(
        renderDataCell('https://lz8a3d793f17ede9b79635cc.blob.core.windows.net/testContainer/test_file.tsv', testAzureWorkspace)
      );
      expect(getByText('Some files are located outside of the current workspace')).toBeTruthy();
    });

    it('does not render a warning for Azure URLs in the workspace storage', () => {
      const { queryByText } = render(
        renderDataCell(
          'https://lz8a3d793f17ede9b79635cc.blob.core.windows.net/sc-77397ce7-bb9b-4339-bc12-95e1f52956de/test_file.tsv',
          testAzureWorkspace
        )
      );
      expect(queryByText('Some files are located outside of the current workspace')).toBeNull();
    });

    it('renders lists of GCS URLs', () => {
      const { getAllByRole } = render(
        renderDataCell(
          {
            itemsType: 'AttributeValue',
            items: ['gs://bucket/file1.txt', 'gs://bucket/file2.txt', 'gs://bucket/file3.txt'],
          },
          testGoogleWorkspace
        )
      );
      const links = getAllByRole('link');
      expect(_.map('textContent', links)).toEqual(['file1.txt', 'file2.txt', 'file3.txt']);
      expect(_.map('href', links)).toEqual(['gs://bucket/file1.txt', 'gs://bucket/file2.txt', 'gs://bucket/file3.txt']);
    });

    it.each([{ testWorkspace: testGoogleWorkspace }, { testWorkspace: testAzureWorkspace }])('renders links to DRS URLs', ({ testWorkspace }) => {
      const { container, getByRole } = render(renderDataCell('drs://example.data.service.org/6cbffaae-fc48-4829-9419-1a2ef0ca98ce', testWorkspace));
      expect(container).toHaveTextContent('drs://example.data.service.org/6cbffaae-fc48-4829-9419-1a2ef0ca98ce');
      const link = getByRole('link');
      expect(link).toHaveAttribute('href', 'drs://example.data.service.org/6cbffaae-fc48-4829-9419-1a2ef0ca98ce');
    });

    it('renders links to Azure URLs', () => {
      const { container, getByRole } = render(renderDataCell('https://sa226344b664da26ad6863.blob.core.windows.net/file1.cram', testAzureWorkspace));
      expect(container).toHaveTextContent('file1.cram');
      const link = getByRole('link');
      expect(link).toHaveAttribute('href', 'https://sa226344b664da26ad6863.blob.core.windows.net/file1.cram');
    });
  });
});
