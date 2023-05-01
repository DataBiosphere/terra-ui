import _ from 'lodash/fp';
import { Fragment, useEffect, useState } from 'react';
import { div, fieldset, h, label, legend, li, p, ul } from 'react-hyperscript-helpers';
import { Clickable, IdContainer, Link, Select } from 'src/components/common';
import { icon } from 'src/components/icons';
import { TextInput, ValidatedInput } from 'src/components/input';
import { getLocalPref, setLocalPref } from 'src/libs/prefs';
import * as Style from 'src/libs/style';

// Additional references supported by Terra that are not included in IGV
const terraReferences = {
  'MN908947.3': {
    id: 'sarsCov2RefId.3',
    indexed: false,
    fastaURL: 'https://storage.googleapis.com/gcp-public-data--broad-references/sars-cov-2/MN908947.3/nCoV-2019.reference.fasta',
  },
};

// The reference genome can be specified using either a 'reference' object or,
// for IGV-hosted references, a 'genome' ID.
// https://github.com/igvteam/igv.js/wiki/Reference-Genome
const igvAvailableReferences = _.map(
  (id) => {
    return _.has(id, terraReferences)
      ? { label: id, value: { reference: { name: id, ...terraReferences[id] } } }
      : { label: id, value: { genome: id } };
  },
  [
    'hg38',
    'hg19',
    'hg18',
    'MN908947.3',
    'ASM985889v3',
    'mm10',
    'panTro4',
    'panPan2',
    'susScr11',
    'bosTau8',
    'canFam3',
    'rn6',
    'danRer10',
    'dm6',
    'sacCer3',
  ]
);

export const defaultIgvReference = { genome: 'hg38' };

const igvRecentlyUsedReferencesPreferenceKey = 'igv-recently-used-references';

export const addIgvRecentlyUsedReference = (reference) => {
  // Store the last 3 references used
  setLocalPref(
    igvRecentlyUsedReferencesPreferenceKey,
    [reference, ..._.remove(reference, getLocalPref(igvRecentlyUsedReferencesPreferenceKey) || [])].slice(0, 3)
  );
};

const IGVRecentlyUsedReferences = ({ onSelect }) => {
  const [customReferences, setCustomReferences] = useState(() => {
    return getLocalPref(igvRecentlyUsedReferencesPreferenceKey) || [];
  });
  useEffect(() => {
    setLocalPref(igvRecentlyUsedReferencesPreferenceKey, customReferences);
  }, [customReferences]);

  return (
    !_.isEmpty(customReferences) &&
    h(IdContainer, [
      (id) =>
        h(Fragment, [
          p({ id, style: { margin: '0 0 0.5rem' } }, ['Recently used references']),
          ul(
            { 'aria-labelledby': id, style: { padding: 0, margin: '0 0 1rem', listStyleType: 'none' } },
            _.map((reference) => {
              const label =
                _.get('genome', reference) ||
                _.get('reference.name', reference) ||
                _.flow(_.get('reference.fastaURL'), _.split('/'), _.last)(reference);

              return li(
                {
                  key: _.get('reference.fastaURL', reference),
                  style: { display: 'flex', padding: '0.125rem 0' },
                },
                [
                  h(
                    Link,
                    {
                      style: { ...Style.noWrapEllipsis, flex: '1 1 auto', minWidth: 0 },
                      onClick: () => onSelect(reference),
                    },
                    [label]
                  ),
                  h(
                    Clickable,
                    {
                      tooltip: `Remove ${label} from this list`,
                      style: { marginLeft: '1ch' },
                      onClick: () => setCustomReferences(_.remove(reference)),
                    },
                    [icon('times')]
                  ),
                ]
              );
            }, customReferences)
          ),
        ]),
    ])
  );
};

const IGVReferenceSelector = ({ value, onChange }) => {
  const isCustomReference = !_.find({ value }, igvAvailableReferences);

  const [fastaUrlInputTouched, setFastaUrlInputTouched] = useState(false);
  const fastaUrlError = isCustomReference && fastaUrlInputTouched && !_.get('reference.fastaURL', value) && 'A FASTA URL is required';

  return h(IdContainer, [
    (id) =>
      div([
        label({ htmlFor: id, style: { fontWeight: 500 } }, ['Reference genome: ']),
        div({ style: { display: 'inline-block', marginLeft: '0.25rem', marginBottom: '1rem', minWidth: 125 } }, [
          h(Select, {
            id,
            options: [...igvAvailableReferences, { value: 'Custom' }],
            value: isCustomReference ? 'Custom' : value,
            onChange: ({ value }) => {
              onChange(value === 'Custom' ? { reference: { fastaURL: '', indexed: false } } : value);
            },
          }),
        ]),
        isCustomReference &&
          fieldset(
            {
              style: { minWidth: 0, padding: 0, border: 0, margin: '0 0 1rem' },
            },
            [
              legend({ style: { padding: 0 } }, ['Custom reference']),

              label(
                {
                  htmlFor: `${id}-custom-reference-name`,
                  style: { display: 'block', margin: '0.5rem 0 0.25rem' },
                },
                ['Name (optional)']
              ),
              h(TextInput, {
                id: `${id}-custom-reference-name`,
                placeholder: 'Reference name',
                value: _.getOr('', 'reference.name', value),
                onChange: (name) => {
                  const update = name ? _.set('name', name) : _.unset('name');
                  onChange(_.update('reference', update, value));
                },
              }),

              label(
                {
                  htmlFor: `${id}-custom-reference-fasta-url`,
                  style: { display: 'block', margin: '0.5rem 0 0.25rem' },
                },
                ['FASTA URL (required)']
              ),
              h(ValidatedInput, {
                inputProps: {
                  id: `${id}-custom-reference-fasta-url`,
                  placeholder: 'gs://my-bucket/reference.fasta',
                  value: _.getOr('', 'reference.fastaURL', value),
                  onChange: (fastaURL) => {
                    onChange(_.set('reference.fastaURL', fastaURL, value));
                    setFastaUrlInputTouched(true);
                  },
                },
                error: fastaUrlError,
              }),

              label(
                {
                  htmlFor: `${id}-custom-reference-index-url`,
                  style: { display: 'block', margin: '0.5rem 0 0.25rem' },
                },
                ['Index URL (optional)']
              ),
              h(TextInput, {
                id: `${id}-custom-reference-index-url`,
                placeholder: 'gs://my-bucket/reference.fasta.fai',
                value: _.getOr('', 'reference.indexURL', value),
                onChange: (indexURL) => {
                  const update = _.flow(_.set('indexed', Boolean(indexURL)), indexURL ? _.set('indexURL', indexURL) : _.unset('indexURL'));
                  onChange(_.update('reference', update, value));
                },
              }),
            ]
          ),

        h(IGVRecentlyUsedReferences, { onSelect: onChange }),
      ]),
  ]);
};

export default IGVReferenceSelector;
