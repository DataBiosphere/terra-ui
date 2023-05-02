import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { ButtonPrimary } from 'src/components/common';
import { getUserProjectForWorkspace } from 'src/components/data/data-utils';
import { spinner } from 'src/components/icons';
import DownloadPrices from 'src/data/download-prices';
import { Ajax } from 'src/libs/ajax';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { useCancellation, useOnMount } from 'src/libs/react-utils';
import { knownBucketRequesterPaysStatuses } from 'src/libs/state';
import * as Utils from 'src/libs/utils';

import els from './uri-viewer-styles';
import { isAzureUri, isDrsUri } from './uri-viewer-utils';

const getMaxDownloadCostNA = (bytes) => {
  const nanos = DownloadPrices.pricingInfo[0].pricingExpression.tieredRates[1].unitPrice.nanos;
  const downloadPrice = (bytes * nanos) / DownloadPrices.pricingInfo[0].pricingExpression.baseUnitConversionFactor / 10e8;

  return Utils.formatUSD(downloadPrice);
};

export const UriDownloadButton = ({ uri, metadata: { bucket, name, fileName, size }, accessUrl, workspace }) => {
  const signal = useCancellation();
  const [url, setUrl] = useState();
  const getUrl = async () => {
    if (accessUrl?.url) {
      /*
      NOTE: Not supporting downloading using `accessUrl.headers`:
      - https://ga4gh.github.io/data-repository-service-schemas/preview/release/drs-1.1.0/docs/#_accessurl

      If we want to support supplying `accessUrl.headers` here we'll probably need a bigger solution.
      As of 2021-05-17 a google search turned up this c. 2018 result that mentioned something called `ServiceWorker`
      - https://stackoverflow.com/questions/51721904/make-browser-submit-additional-http-header-if-click-on-hyperlink#answer-51784608
       */
      setUrl(_.isEmpty(accessUrl.headers) ? accessUrl.url : null);
    } else if (isAzureUri(uri)) {
      setUrl(uri);
    } else {
      try {
        // This is still using Martha instead of DrsHub because DrsHub has not yet implemented signed URLs
        const { url } = await Ajax(signal).DrsUriResolver.getSignedUrl({
          bucket,
          object: name,
          dataObjectUri: isDrsUri(uri) ? uri : undefined,
        });
        const userProject = await getUserProjectForWorkspace(workspace);
        setUrl(knownBucketRequesterPaysStatuses.get()[bucket] ? Utils.mergeQueryParams({ userProject }, url) : url);
      } catch (error) {
        setUrl(null);
      }
    }
  };
  useOnMount(() => {
    getUrl();
  });

  return els.cell([
    url === null
      ? 'Unable to generate download link.'
      : div({ style: { display: 'flex', justifyContent: isAzureUri(url) ? 'left' : 'center' } }, [
          h(
            ButtonPrimary,
            {
              disabled: !url,
              onClick: () => {
                Ajax().Metrics.captureEvent(Events.workspaceDataDownload, {
                  ...extractWorkspaceDetails(workspace),
                  fileType: _.head(/\.\w+$/.exec(uri)),
                  downloadFrom: 'file direct',
                });
              },
              href: url,
              /*
           NOTE:
           Some DOS/DRS servers return file names that are different from the end of the path in the gsUri/url.
           Attempt to hint to the browser the correct name.
           FYI this hint doesn't work in Chrome: https://bugs.chromium.org/p/chromium/issues/detail?id=373182#c24
           */
              download: fileName,
              ...Utils.newTabLinkProps,
            },
            [
              url
                ? isAzureUri(url)
                  ? 'Download'
                  : `Download for ${getMaxDownloadCostNA(size)}*`
                : h(Fragment, ['Generating download link...', spinner({ style: { color: 'white', marginLeft: 4 } })]),
            ]
          ),
        ]),
  ]);
};
