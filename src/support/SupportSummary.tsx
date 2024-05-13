import ReactJson from '@microlink/react-json-view';
import React, { useEffect, useState } from 'react';
import { FullyQualifiedResourceId } from 'src/libs/ajax/SamResources';
import colors from 'src/libs/colors';
import { reportError } from 'src/libs/error';
import { ResourceTypeSummaryProps } from 'src/support/SupportResourceType';

export const SupportSummary = (props: ResourceTypeSummaryProps) => {
  const [summaryInfo, setSummaryInfo] = useState<object>();
  const [errorMessage, setErrorMessage] = useState<string>('');
  const resourceId = props.fqResourceId.resourceId;
  const fqResourceId = props.fqResourceId;

  async function loadSupportSummary(id: FullyQualifiedResourceId) {
    if (props.loadSupportSummaryFn) {
      return props.loadSupportSummaryFn(id);
    }
    // throw error here because this component should not be used without a summary function
    throw new Error('No support summary function provided');
  }

  function clear() {
    setErrorMessage('');
    setSummaryInfo(undefined);
  }

  useEffect(() => {
    const loadSummary = async () => {
      clear();
      if (resourceId) {
        try {
          setSummaryInfo(await loadSupportSummary(fqResourceId));
        } catch (e) {
          if (e instanceof Response && e.status === 404) {
            setErrorMessage(`${props.displayName} not found`);
          } else if (e instanceof Response && e.status === 403) {
            setErrorMessage(
              `You do not have permission to view ${props.displayName} summary information or are not on VPN`
            );
          } else {
            await reportError('Error loading group summary', e);
          }
        }
      }
    };

    loadSummary();
    // eslist complains about loadSupportSummary being a dependency, but adding it causes an infinite loop
  }, [fqResourceId, resourceId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {!!errorMessage && <div style={{ color: colors.danger(), marginLeft: '1rem' }}>{errorMessage}</div>}
      {!!summaryInfo && (
        <>
          <div
            style={{
              color: colors.dark(),
              fontSize: 18,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              marginLeft: '1rem',
              marginTop: '1rem',
            }}
          >
            {props.displayName} Summary
          </div>
          <ReactJson
            src={summaryInfo}
            name={false}
            style={{ marginLeft: '1rem', border: '1px solid black', padding: '1rem' }}
          />
        </>
      )}
    </>
  );
};
