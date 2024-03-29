import { screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { ImportRequest } from './import-types';
import { ImportDataOverview, ImportDataOverviewProps } from './ImportDataOverview';

const renderImportDataOverview = (props: Partial<ImportDataOverviewProps> = {}): void => {
  render(
    h(ImportDataOverview, {
      importRequest: { type: 'pfb', url: new URL('https://example.com/path/to/file.pfb') },
      ...props,
    })
  );
};

describe('ImportDataOverview', () => {
  it.each([
    {
      importRequest: { type: 'pfb', url: new URL('https://service.prod.anvil.gi.ucsc.edu/path/to/file.pfb') },
      shouldShowProtectedDataWarning: true,
    },
    {
      importRequest: { type: 'pfb', url: new URL('https://example.com/path/to/file.pfb') },
      shouldShowProtectedDataWarning: false,
    },
  ] as { importRequest: ImportRequest; shouldShowProtectedDataWarning: boolean }[])(
    'should render warning about protected data',
    ({ importRequest, shouldShowProtectedDataWarning }) => {
      renderImportDataOverview({ importRequest });

      const protectedDataWarning = screen.queryByText(
        'The data you have selected requires additional security monitoring',
        {
          exact: false,
        }
      );
      const isWarningShown = !!protectedDataWarning;
      expect(isWarningShown).toBe(shouldShowProtectedDataWarning);
    }
  );
});
