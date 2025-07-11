import { icon } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React from 'react';
import Collapse from 'src/components/Collapse';
import { Link } from 'src/components/common';
import { InfoBox } from 'src/components/InfoBox';
import { NihDatasetPermission } from 'src/libs/ajax/User';
import * as Utils from 'src/libs/utils';
import { linkStyles as styles } from 'src/profile/external-identities/LinkStyles';

interface NihResourcesProps {
  authorizedDatasets: NihDatasetPermission[];
  unauthorizedDatasets: NihDatasetPermission[];
}

export const NihResources: React.FC<NihResourcesProps> = ({ authorizedDatasets, unauthorizedDatasets }) => {
  return (
    <div style={styles.idLink.linkContentBottom}>
      <h3 style={{ fontWeight: 500, margin: 0 }}>Resources</h3>
      {!_.isEmpty(authorizedDatasets) && (
        <Collapse style={{ marginTop: '1rem' }} title='Authorized to access' titleFirst initialOpenState>
          <div style={{ marginTop: '0.5rem' }}>
            {_.map(
              ({ name }) => (
                <div key={name} style={{ lineHeight: '24px' }}>
                  {name}
                </div>
              ),
              authorizedDatasets
            )}
          </div>
        </Collapse>
      )}
      {!_.isEmpty(unauthorizedDatasets) && (
        <Collapse
          style={{ marginTop: '1rem' }}
          title='Not authorized'
          titleFirst
          afterTitle={
            <InfoBox>
              Your account was linked, but you are not authorized to view these controlled datasets. If you think you
              should have access, please{' '}
              <Link href='https://dbgap.ncbi.nlm.nih.gov/aa/wga.cgi?page=login' {...Utils.newTabLinkProps}>
                verify your credentials here
                {icon('pop-out', { size: 12, style: { marginLeft: '0.2rem', verticalAlign: 'baseline' } })}
              </Link>
              .
            </InfoBox>
          }
        >
          <div style={{ marginTop: '0.5rem' }}>
            {_.map(
              ({ name }) => (
                <div key={name} style={{ lineHeight: '24px' }}>
                  {name}
                </div>
              ),
              unauthorizedDatasets
            )}
          </div>
        </Collapse>
      )}
    </div>
  );
};
