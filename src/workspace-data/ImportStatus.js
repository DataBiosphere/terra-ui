import _ from 'lodash/fp';
import { Fragment } from 'react';
import { h, p } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { Ajax } from 'src/libs/ajax';
import { withErrorReporting } from 'src/libs/error';
import { clearNotification, notify } from 'src/libs/notifications';
import { useCancellation, usePollingEffect, useStore } from 'src/libs/react-utils';
import { asyncImportJobStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';

const ImportStatus = () => {
  const jobs = useStore(asyncImportJobStore);
  return h(
    Fragment,
    _.map(
      (job) =>
        h(ImportStatusItem, {
          key: job.jobId,
          job,
          onDone: () => {
            asyncImportJobStore.update(_.reject({ jobId: job.jobId }));
          },
        }),
      _.uniq(jobs)
    )
  );
};

function ImportStatusItem({ job: { targetWorkspace, jobId }, onDone }) {
  const signal = useCancellation();

  usePollingEffect(
    withErrorReporting('Problem checking status of data import', async () => {
      await checkForCompletion(targetWorkspace, jobId);
    }),
    { ms: 5000 }
  );

  const checkForCompletion = async ({ namespace, name }, jobId) => {
    const fetchImportStatus = async () => {
      try {
        return await Ajax(signal).Workspaces.workspace(namespace, name).getImportJobStatus(jobId);
      } catch (error) {
        // Ignore 404; We're probably asking for status before the status endpoint knows about the job
        if (error.status === 404) {
          return { status: 'PENDING' };
        }
        onDone();
        throw error;
      }
    };

    const response = await fetchImportStatus();
    const { message, status } = response;

    // import service statuses: Pending, Translating, ReadyForUpsert, Upserting, Done, Error
    const successNotify = () =>
      notify('success', 'Data imported successfully.', {
        message: h(Fragment, [
          p([`Data import to workspace "${namespace} / ${name}" is complete. Please refresh the Data view.`]),
          p([
            `If data is imported from external sources like PFB or TDR, prefixes ("pfb:" or tdr:" respectively)
        may be prepended to column names. If present, prefix values must be included in workflow configuration
        attribute references as described `,
            h(
              Link,
              {
                'aria-label': 'Support article',
                href: 'https://support.terra.bio/hc/en-us/articles/360051722371-Data-table-attribute-namespace-support-pfb-prefix-#h_01ENT95Y0KM48QFRMJ44DEXS7S',
                ...Utils.newTabLinkProps,
              },
              ['here.']
            ),
          ]),
        ]),
      });

    const errorNotify = () => notify('error', 'Error importing data.', { message });

    if (!_.includes(status, ['Pending', 'Translating', 'ReadyForUpsert', 'Upserting'])) {
      Utils.switchCase(
        status,
        ['Done', successNotify],
        ['Error', errorNotify],
        [Utils.DEFAULT, () => notify('error', 'Unexpected error importing data', response)]
      );
      clearNotification(jobId);
      onDone();
    }
  };

  return null;
}

export default ImportStatus;
