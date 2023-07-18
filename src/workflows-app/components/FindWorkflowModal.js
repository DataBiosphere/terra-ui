import _ from 'lodash/fp';
import { useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { ButtonPrimary, Clickable, Link } from 'src/components/common';
import { centeredSpinner, icon } from 'src/components/icons';
import ModalDrawer from 'src/components/ModalDrawer';
import { TextCell } from 'src/components/table';
import { Ajax } from 'src/libs/ajax';
import { Apps } from 'src/libs/ajax/leonardo/Apps';
import colors from 'src/libs/colors';
import { getConfig } from 'src/libs/config';
import * as Nav from 'src/libs/nav';
import { notify } from 'src/libs/notifications';
import { useCancellation } from 'src/libs/react-utils';
import { getUser } from 'src/libs/state';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { resolveRunningCromwellAppUrl } from 'src/libs/workflows-app-utils';
import HelpfulLinksBox from 'src/workflows-app/components/HelpfulLinksBox';
import ImportGithub from 'src/workflows-app/components/ImportGithub';
import { MethodCard } from 'src/workflows-app/components/MethodCard';

const styles = {
  findWorkflowSubHeader: (selected) => {
    return {
      ...Style.navList.itemContainer(selected),
      ...Style.navList.item(selected),
      ...(selected ? { backgroundColor: colors.accent(0.2) } : {}),
      paddingLeft: '3rem',
    };
  },
};

const suggestedWorkflowsList = [
  {
    method_name: 'Optimus',
    method_description:
      'The optimus 3 pipeline processes 10x genomics sequencing data based on the v2 chemistry. It corrects cell barcodes and UMIs, aligns reads, marks duplicates, and returns data as alignments in BAM format and as counts in sparse matrix exchange format.',
    method_source: 'GitHub',
    method_version: 'Optimus_v5.7.2',
    method_url: 'https://raw.githubusercontent.com/broadinstitute/warp/Optimus_v5.7.2/pipelines/skylab/optimus/Optimus.wdl',
  },
  {
    method_name: 'MultiSampleSmartSeq2SingleNucleus',
    method_description: 'The MultiSampleSmartSeq2SingleNucleus pipeline runs multiple snSS2 samples in a single pipeline invocation.',
    method_source: 'GitHub',
    method_version: 'MultiSampleSmartSeq2SingleNucleus_v1.2.18',
    method_url:
      'https://raw.githubusercontent.com/broadinstitute/warp/MultiSampleSmartSeq2SingleNucleus_v1.2.18/pipelines/skylab/smartseq2_single_nucleus_multisample/MultiSampleSmartSeq2SingleNucleus.wdl',
  },
  {
    method_name: 'scATAC',
    method_description: 'Processing of single-cell ATAC-seq data with the scATAC pipeline.',
    method_source: 'GitHub',
    method_version: 'scATAC_v1.3.1',
    method_url: 'https://raw.githubusercontent.com/broadinstitute/warp/scATAC_v1.3.1/pipelines/skylab/scATAC/scATAC.wdl',
  },
  {
    method_name: 'WholeGenomeGermlineSingleSample',
    method_description: 'Processes germline whole genome sequencing data.',
    method_source: 'GitHub',
    method_version: 'WholeGenomeGermlineSingleSample_v3.1.10',
    method_url:
      'https://raw.githubusercontent.com/broadinstitute/warp/WholeGenomeGermlineSingleSample_v3.1.10/pipelines/broad/dna_seq/germline/single_sample/wgs/WholeGenomeGermlineSingleSample.wdl',
  },
  {
    method_name: 'ExomeGermlineSingleSample',
    method_description: 'Processes germline exome/targeted sequencing data.',
    method_source: 'GitHub',
    method_version: 'ExomeGermlineSingleSample_v3.1.9',
    method_url:
      'https://raw.githubusercontent.com/broadinstitute/warp/ExomeGermlineSingleSample_v3.1.9/pipelines/broad/dna_seq/germline/single_sample/exome/ExomeGermlineSingleSample.wdl',
  },
];

const FindWorkflowModal = ({ onDismiss, workspace }) => {
  const [selectedSubHeader, setSelectedSubHeader] = useState('browse-suggested-workflows');
  const [loading, setLoading] = useState(false);

  const signal = useCancellation();

  const subHeadersMap = {
    'browse-suggested-workflows': 'Browse Suggested Workflows',
    'add-a-workflow-link': 'Add a Workflow Link',
    ...(getConfig().isDockstoreEnabled && { 'go-to-dockstore': h(TextCell, {}, ['Dockstore', icon('export', { style: { marginLeft: '0.5rem' } })]) }),
  };

  const isSubHeaderActive = (subHeader) => selectedSubHeader === subHeader;

  const submitMethod = async (signal, onDismiss, method, workspace) => {
    const namespace = await workspace.workspace.namespace;
    try {
      const cbasUrl = (
        await Apps(signal)
          .listAppsV2(workspace.workspace.workspaceId)
          .then((apps) => resolveRunningCromwellAppUrl(apps, getUser()?.email))
      ).cbasUrl;

      if (cbasUrl) {
        const methodPayload = {
          method_name: method.method_name,
          method_description: method.method_description,
          method_source: method.method_source,
          method_version: method.method_version,
          method_url: method.method_url,
        };
        const methodObject = await Ajax(signal).Cbas.methods.post(cbasUrl, methodPayload);
        onDismiss();
        Nav.goToPath('workspace-workflows-app-submission-config', {
          name: workspace.workspace.name,
          namespace,
          methodId: methodObject.method_id,
        });
      }
    } catch (error) {
      notify('error', 'Error creating new method', { detail: error instanceof Response ? await error.text() : error });
      onDismiss();
    }
  };

  return h(
    ModalDrawer,
    {
      'aria-label': 'Find a Workflow Modal',
      isOpen: true,
      width: '70%',
      onDismiss,
    },
    [
      div({ style: { display: 'flex', alignItems: 'center', flex: 'none', padding: '0 20px 20px', margin: '1.5rem 0 .5rem 0rem' } }, [
        div({ style: { fontSize: 18, fontWeight: 600 } }, ['Find a Workflow']),
        div({ style: { marginLeft: 'auto', display: 'flex' } }, [
          onDismiss &&
            h(
              Link,
              {
                'aria-label': 'Close',
                style: { marginLeft: '2rem' },
                tabIndex: 0,
                onClick: onDismiss,
              },
              [icon('times', { size: 30 })]
            ),
        ]),
      ]),
      div({ role: 'main', style: { display: 'flex', flex: 1, height: 'calc(100% - 66px)', paddingLeft: '20px' } }, [
        div({ style: { minWidth: 330, maxWidth: 330, overflowY: 'auto' } }, [
          _.map(([subHeaderKey, subHeaderName]) => {
            const isActive = isSubHeaderActive(subHeaderKey);
            return loading
              ? centeredSpinner()
              : h(
                  Clickable,
                  {
                    'aria-label': `${subHeaderKey}-header-button`,
                    style: { ...styles.findWorkflowSubHeader(isActive), color: isActive ? colors.accent(1.1) : colors.accent(), fontSize: 16 },
                    onClick: () => setSelectedSubHeader(subHeaderKey),
                    hover: Style.navList.itemHover(isActive),
                    'aria-current': isActive,
                    key: subHeaderKey,
                  },
                  [subHeaderName]
                );
          }, Object.entries(subHeadersMap)),
        ]),
        isSubHeaderActive('browse-suggested-workflows') &&
          div({ style: { overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', paddingLeft: '20px' } }, [
            div({ style: { display: 'flex', flexWrap: 'wrap', overflowY: 'auto', paddingBottom: 5, paddingLeft: 5 } }, [
              _.map(
                (method) =>
                  h(MethodCard, {
                    method,
                    onClick: () => Utils.withBusyState(setLoading, submitMethod(signal, onDismiss, method, workspace)),
                    key: method.method_name,
                  }),
                suggestedWorkflowsList
              ),
            ]),
          ]),
        isSubHeaderActive('add-a-workflow-link') && h(ImportGithub, { setLoading, signal, onDismiss, workspace, submitMethod }),
        isSubHeaderActive('go-to-dockstore') &&
          div({ style: { marginLeft: '4rem', width: '50%' } }, [
            h(
              ButtonPrimary,
              { style: { width: 225 }, href: `${getConfig().dockstoreUrlRoot}/search?_type=workflow&descriptorType=WDL&searchMode=files` },
              ['Go to Dockstore']
            ),
          ]),
        div({ style: { marginLeft: '10rem', marginRight: '1.5rem', width: '40%' } }, [h(HelpfulLinksBox)]),
      ]),
    ]
  );
};

export default FindWorkflowModal;
