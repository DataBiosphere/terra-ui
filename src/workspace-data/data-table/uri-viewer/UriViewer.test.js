import { screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { bucketBrowserUrl, bucketFileBrowserUrl } from 'src/auth/auth';
import { Link } from 'src/components/common';
import * as Utils from 'src/libs/utils';
import { renderWithAppContexts } from 'src/testing/test-utils';

describe('UriViewer Links', () => {
  const gsUri = 'gs://my-bucket/my-file.txt';
  const accessUrl = null;

  it('should render link to view file in Google Cloud Storage Browser', () => {
    renderWithAppContexts(
      !accessUrl &&
        !!gsUri &&
        h(
          Link,
          {
            ...Utils.newTabLinkProps,
            href: bucketFileBrowserUrl(gsUri.match(/gs:\/\/(.+?)\/(.+)/)[1], gsUri.match(/gs:\/\/(.+?)\/(.+)/)[2]),
          },
          ['View this file in the Google Cloud Storage Browser']
        )
    );

    const link = screen.getByText('View this file in the Google Cloud Storage Browser');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      'href',
      'https://console.cloud.google.com/storage/browser/_details/my-bucket/my-file.txt;tab=live_object?authuser=undefined'
    );
  });

  it('should render link to view folder in Google Cloud Storage Browser', () => {
    renderWithAppContexts(
      !accessUrl &&
        !!gsUri &&
        h(
          Link,
          {
            ...Utils.newTabLinkProps,
            href: bucketBrowserUrl(gsUri.match(/gs:\/\/(.+)\//)[1]),
          },
          ['View the folder containing this file in Google Cloud Storage Browser']
        )
    );

    const link = screen.getByText('View the folder containing this file in Google Cloud Storage Browser');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://console.cloud.google.com/storage/browser/my-bucket?authuser=undefined');
  });
});
