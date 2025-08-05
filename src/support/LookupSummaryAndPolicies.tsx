import { ButtonPrimary } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { useState } from 'react';
import { TextInput } from 'src/components/input';
import colors from 'src/libs/colors';
import { reportError } from 'src/libs/error';
import * as Nav from 'src/libs/nav';
import { ResourcePolicies } from 'src/support/ResourcePolicies';
import { ResourceTypeSummaryProps, supportResources } from 'src/support/SupportResourceType';
import { SupportSummary } from 'src/support/SupportSummary';

export const LookupSummaryAndPolicies = (props: ResourceTypeSummaryProps) => {
  const { query } = Nav.useRoute();
  const [resourceId, setResourceId] = useState<string>(props.fqResourceId.resourceId);
  const [lookupValue, setLookupValue] = useState<string>('');
  const [googleProjectId, setGoogleProjectId] = useState<string>('');
  const [isGoogleProjectLookup, setIsGoogleProjectLookup] = useState<boolean>(false);

  function submit(overrideResourceId?: string) {
    Nav.updateSearch({ ...query, resourceId: overrideResourceId || resourceId || undefined });
  }

  // event hook to clear the resourceId when resourceType changes
  React.useEffect(() => {
    setResourceId('');
    setLookupValue('');
    setGoogleProjectId('');
  }, [props.fqResourceId.resourceTypeName]);

  // the resourceType may be configured to skip policy retrieval/display
  const displayPolicies = !_.find((res) => res.resourceType === props.fqResourceId.resourceTypeName, supportResources)
    ?.skipPolicies;

  // Get the current resource type configuration
  const currentResourceType = _.find(
    (res) => res.resourceType === props.fqResourceId.resourceTypeName,
    supportResources
  );

  const supportSummaryProps: ResourceTypeSummaryProps = React.useMemo(() => {
    if (isGoogleProjectLookup && googleProjectId) {
      // Override loadSupportSummaryFn to use Google Project ID lookup
      return {
        ...props,
        fqResourceId: { resourceId: googleProjectId, resourceTypeName: props.fqResourceId.resourceTypeName },
        loadSupportSummaryFn: currentResourceType?.loadSupportSummaryByGoogleProjectId
          ? () => currentResourceType.loadSupportSummaryByGoogleProjectId!(googleProjectId)
          : undefined,
      };
    }
    // Default behavior for workspace ID lookup
    return {
      ...props,
      fqResourceId: { resourceId, resourceTypeName: props.fqResourceId.resourceTypeName },
    };
  }, [props, resourceId, googleProjectId, isGoogleProjectLookup, currentResourceType]);

  // event hook to clear the resourceId when resourceType changes
  React.useEffect(() => {
    setResourceId('');
    setLookupValue('');
    setGoogleProjectId('');
  }, [props.fqResourceId.resourceTypeName]);

  // Handle lookup when the resource type has a lookupResourceId function
  const handleLookup = async () => {
    if (currentResourceType?.lookupResourceIdFn && lookupValue) {
      try {
        const result = await currentResourceType.lookupResourceIdFn(lookupValue);
        setResourceId(result.resourceId);
        // specify the resourceId to avoid waiting for state to update
        submit(result.resourceId);
      } catch (error: any) {
        const errorMessage = error.status === 404 ? `${lookupValue} not found` : `Error looking up id: ${error}`;
        await reportError(errorMessage);
      }
    }
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1rem' }}>
        <div
          style={{
            color: colors.dark(),
            fontSize: 18,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            marginLeft: '1rem',
            marginBottom: '0.5rem',
          }}
        >
          {props.displayName}
        </div>

        {currentResourceType?.lookupResourceIdFn && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <TextInput
              style={{ marginRight: '0.5rem', marginLeft: '1rem', flex: 1 }}
              placeholder={`Enter ${currentResourceType.lookupResourceIdBoxPlaceholder}`}
              onChange={setLookupValue}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleLookup();
                }
              }}
              value={lookupValue}
            />
            <ButtonPrimary onClick={handleLookup}>
              Load By {currentResourceType.lookupResourceIdBoxPlaceholder}
            </ButtonPrimary>
          </div>
        )}

        {currentResourceType?.lookupResourceIdFn && (
          <div style={{ marginRight: '0.5rem', marginLeft: '1rem', flex: 1, marginBottom: '0.5rem' }}>
            <div style={{ fontWeight: 500 }}>or</div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <TextInput
            style={{ marginRight: '0.5rem', marginLeft: '1rem', flex: 1 }}
            placeholder={`Enter ${props.displayName} ID`}
            onChange={(newResourceId) => {
              setResourceId(newResourceId);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsGoogleProjectLookup(false);
                submit();
              }
            }}
            value={resourceId}
          />
          <ButtonPrimary
            onClick={() => {
              setIsGoogleProjectLookup(false);
              submit();
            }}
          >
            Load By ID
          </ButtonPrimary>
        </div>

        {currentResourceType?.lookupByGoogleProjectPlaceHolder && (
          <div style={{ marginRight: '0.5rem', marginLeft: '1rem', flex: 1, marginBottom: '0.5rem' }}>
            <div style={{ fontWeight: 500 }}>or</div>
          </div>
        )}

        {currentResourceType?.lookupByGoogleProjectPlaceHolder && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <TextInput
              style={{ marginRight: '0.5rem', marginLeft: '1rem', flex: 1 }}
              placeholder={`Enter ${currentResourceType.lookupByGoogleProjectPlaceHolder}`}
              onChange={setGoogleProjectId}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsGoogleProjectLookup(true);

                  submit(googleProjectId);
                }
              }}
              value={googleProjectId}
            />
            <ButtonPrimary
              onClick={() => {
                setIsGoogleProjectLookup(true);

                submit(googleProjectId);
              }}
            >
              Load By {currentResourceType.lookupByGoogleProjectPlaceHolder}
            </ButtonPrimary>
          </div>
        )}
      </div>
      {!!supportSummaryProps.loadSupportSummaryFn && <SupportSummary {...supportSummaryProps} />}
      {displayPolicies && <ResourcePolicies {...props} />}
    </>
  );
};
