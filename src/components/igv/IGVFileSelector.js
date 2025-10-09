import _ from 'lodash/fp';
import { useEffect, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List } from 'react-virtualized';
import ButtonBar from 'src/components/ButtonBar';
import { ButtonPrimary, LabeledCheckbox, Link } from 'src/components/common';
import IGVReferenceSelector, { addIgvRecentlyUsedReference, defaultIgvReference } from 'src/components/igv/IGVReferenceSelector';
import { DrsUriResolver } from 'src/libs/ajax/drs/DrsUriResolver';
import { Workspaces } from 'src/libs/ajax/workspaces/Workspaces';
import { useCancellation } from 'src/libs/react-utils';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';

const getStrings = (v) => {
  return Utils.cond([_.isString(v), () => [v]], [!!v?.items, () => _.flatMap(getStrings, v.items)], () => []);
};

const splitExtension = (fileUrl) => {
  const extensionDelimiterIndex = fileUrl.lastIndexOf('.');
  const base = fileUrl.slice(0, extensionDelimiterIndex);
  const extension = fileUrl.slice(extensionDelimiterIndex + 1);
  return [base, extension];
};

/** Get file extension from URL, even if two-part / compound (e.g. "vcf.gz") */
const getCompoundExtension = (fileUrl) => {
  const splitPath = fileUrl.split('?')[0].split('.');
  const numExtensions = splitPath.length > 2 ? 2 : 1;

  return splitPath.slice(-1 * numExtensions).join('.');
};

export const getIgvMetricDetails = (selectedFiles, refGenome) => {
  const igvNumTracks = selectedFiles.length;
  const igvHasDrsUris = selectedFiles.some((f) => f.isSignedUrl);
  const igvFileExtensions = selectedFiles.map((f) => f.filePath && getCompoundExtension(f.filePath));
  const igvIndexExtensions = selectedFiles.map((f) => f.indexFilePath && getCompoundExtension(f.indexFilePath));
  const igvGenome = refGenome.genome;
  return {
    igvNumTracks,
    igvFileExtensions,
    igvIndexExtensions,
    igvHasDrsUris,
    igvGenome,
  };
};

const UUID_PATTERN = '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}';

const UUID_REGEX = new RegExp(UUID_PATTERN);

const isUUID = (s) => UUID_REGEX.test(s);

const isTdrUrl = (fileUrl) => {
  const parts = fileUrl.split('/').slice(2);
  const bucket = parts[0];
  const datasetId = parts[1];
  const fileRefId = parts[2];
  return /datarepo(-(dev|alpha|perf|staging|tools))?-[a-f0-9]+-bucket/.test(bucket) && isUUID(datasetId) && isUUID(fileRefId);
};

const genomicFiles = ['bam', 'bed', 'cram', 'gz', 'vcf'];
const indexFiles = ['bai', 'crai', 'idx', 'tbi'];
const allFiles = new Set(genomicFiles.concat(indexFiles));

function indexMap(base) {
  return {
    cram: [`${base}.crai`, `${base}.cram.crai`],
    bam: [`${base}.bai`, `${base}.bam.bai`],
    vcf: [`${base}.idx`, `${base}.vcf.idx`, `${base}.tbi`, `${base}.vcf.tbi`],
    gz: [`${base}.gz.tbi`],
  };
}

const searchDBForIndexFiles = async (workspace, entityType, indexCandidates, signal) => {
  const { namespace, name } = workspace.workspace;
  const filterCandidates = indexCandidates.map((candidate) => candidate.split('/').pop()).join(' ');
  const searchResponse = await Workspaces(signal).workspace(namespace, name).paginatedEntitiesOfType(entityType, {
    filterOperator: 'or',
    filterTerms: filterCandidates,
  });

  const URL_REGEX = /^(gs:\/\/|drs:\/\/|https?:\/\/|ftp:\/\/)/;

  for (const result of searchResponse.results) {
    const attributeValues = Object.values(result.attributes);
    const match = attributeValues.find((val) => {
      if (typeof val !== 'string') return false;
      const fileName = val.split('/').pop();
      return filterCandidates.includes(fileName);
    });
    if (match) {
      let urlCandidate = match;
      if (!URL_REGEX.test(match)) {
        urlCandidate = attributeValues.find((val) => typeof val === 'string' && URL_REGEX.test(val));
      }
      if (urlCandidate && URL_REGEX.test(urlCandidate)) {
        return await validateUrl(urlCandidate);
      }
    }
  }
  return undefined;
};

const findIndexForFile = async (workspace, entityType, fileUrl, fileUrls, signal) => {
  if (!genomicFiles.some((extension) => fileUrl.pathname.endsWith(extension))) {
    return undefined;
  }

  if (isTdrUrl(fileUrl.href)) {
    const parts = fileUrl.href.split('/').slice(2);
    const bucket = parts[0];
    const datasetId = parts[1];
    // parts[2] is the fileRef. Skip it since the index file will have a different file ref.
    const otherPathSegments = parts.slice(3, -1);
    const filename = parts.at(-1);
    const [base, extension] = splitExtension(filename);
    const indexCandidates = indexMap(base)[extension].map(
      (candidate) => new RegExp([`gs://${bucket}`, datasetId, UUID_PATTERN, ...otherPathSegments, candidate].join('/'))
    );
    return fileUrls.find((url) => indexCandidates.some((candidate) => candidate.test(url.href)));
  }

  const [base, extension] = splitExtension(fileUrl.pathname);
  const indexCandidates = indexMap(base)[extension];
  const foundIndex = fileUrls.find((url) => indexCandidates.includes(url.pathname));
  if (foundIndex) {
    return foundIndex;
  }
  return await searchDBForIndexFiles(workspace, entityType, indexCandidates, signal);
};

// Determine whether filename has an IGV-eligible extension
const hasValidIgvExtension = (filename) => {
  const [base, extension] = splitExtension(filename);
  return !!base && allFiles.has(extension);
};

export const getDrsDataObjectMetadata = async (value, fields, signal = undefined) => {
  try {
    return await DrsUriResolver(signal).getDataObjectMetadata(value, fields);
  } catch {
    return {
      fileName: '',
      accessUrl: { url: '' },
    };
  }
};

export const resolveValidIgvDrsUris = async (values, signal) => {
  const igvDrsUris = [];

  await Promise.all(
    values.map(async (value) => {
      if (isDrsUri(value)) {
        const { fileName } = await getDrsDataObjectMetadata(value, ['fileName'], signal);
        const isValid = hasValidIgvExtension(fileName);
        if (isValid) {
          igvDrsUris.push(value);
        }
      }
    })
  );

  const igvAccessUrls = [];
  await Promise.all(
    igvDrsUris.map(async (value) => {
      const { accessUrl } = await getDrsDataObjectMetadata(value, ['accessUrl'], signal);
      igvAccessUrls.push(accessUrl.url);
    })
  );

  return igvAccessUrls;
};

const validateUrl = async (fileRef) => {
  const isDrs = isDrsUri(fileRef);
  let accessUrl;

  if (isDrs) {
    const result = await getDrsDataObjectMetadata(fileRef, ['accessUrl']);
    accessUrl = result.accessUrl.url;
  } else {
    accessUrl = fileRef;
  }

  const url = new URL(accessUrl);
  url.isSignedUrl = isDrs;

  return url;
};

export const getValidIgvFiles = async (workspace, entityType, allValues, signal) => {
  // De-duplicate values to prevent processing/displaying the same file multiple times.
  const values = _.uniq(allValues);

  const basicFileUrls = values.filter((value) => {
    let url;
    try {
      // Filter to values containing URLs.
      url = new URL(value);

      // Filter to GCS URLs (IGV.js supports GCS URLs).
      if (url.protocol !== 'gs:') {
        return false;
      }

      // Filter to URLs that point to a file with one of the relevant extensions.
      const filename = url.pathname.split('/').at(-1);
      return hasValidIgvExtension(filename);
    } catch {
      return false;
    }
  });

  const fileUrls = basicFileUrls.map((fus) => {
    const url = new URL(fus);
    url.isSignedUrl = false;
    return url;
  });

  const accessUrls = await resolveValidIgvDrsUris(values, signal);
  for (const accessUrl of accessUrls) {
    const url = new URL(accessUrl);

    // Reliably indicate this is an access URL that should not be modified
    // downstream, as done e.g. for some requester-pays URLS not resolved
    // via DRS Hub.
    url.isSignedUrl = true;

    fileUrls.push(url);
  }

  const results = await Promise.all(
    fileUrls.map(async (fileUrl) => {
      const filePath = fileUrl.href;
      const isSignedUrl = fileUrl.isSignedUrl;
      if (fileUrl.pathname.endsWith('.bed')) {
        return [{ filePath, indexFilePath: false, isSignedUrl }];
      }
      const indexFileUrl = await findIndexForFile(workspace, entityType, fileUrl, fileUrls, signal);
      if (indexFileUrl !== undefined) {
        return [{ filePath, indexFilePath: indexFileUrl.href, isSignedUrl }];
      }
      return [];
    })
  );

  return results.flat();
};

export const getValidIgvFilesFromAttributeValues = async (workspace, entityType, attributeValues, signal) => {
  const allAttributeStrings = _.flatMap(getStrings, attributeValues);

  return await getValidIgvFiles(workspace, entityType, allAttributeStrings, signal);
};

export const isDrsUri = (value) => {
  return !!value?.toString().startsWith('drs://');
};

const IGVFileSelector = ({ workspace, entityType, selectedEntities, onSuccess }) => {
  const [refGenome, setRefGenome] = useState(defaultIgvReference);
  const isRefGenomeValid = Boolean(_.get('genome', refGenome) || _.get('reference.fastaURL', refGenome));

  const [selections, setSelections] = useState([]);
  const [isSearchingFiles, setIsSearchingFiles] = useState(true);

  const signal = useCancellation();

  useEffect(() => {
    async function fetchData() {
      const allAttributeValues = _.flatMap(_.flow(_.get('attributes'), _.values), selectedEntities);
      const selections = await getValidIgvFilesFromAttributeValues(workspace, entityType, allAttributeValues, signal);

      setSelections(selections);
      setIsSearchingFiles(false);
    }
    fetchData();
  }, [workspace, entityType, selectedEntities, setSelections, signal]);

  const toggleSelected = (index) => setSelections(_.update([index, 'isSelected'], (v) => !v));
  const numSelected = _.countBy('isSelected', selections).true;
  const isSelectionValid = !!numSelected;

  const noRowsMessage = isSearchingFiles ? 'Searching for valid files with indices...' : 'No valid files with indices found';

  const cache = new CellMeasurerCache({
    fixedWidth: true,
    defaultHeight: 30,
  });

  return div({ style: Style.modalDrawer.content }, [
    h(IGVReferenceSelector, {
      value: refGenome,
      onChange: setRefGenome,
    }),
    div({ style: { marginBottom: '1rem', display: 'flex' } }, [
      div({ style: { fontWeight: 500 } }, ['Select:']),
      h(Link, { style: { padding: '0 0.5rem' }, onClick: () => setSelections(_.map(_.set('isSelected', true))) }, ['all']),
      '|',
      h(Link, { style: { padding: '0 0.5rem' }, onClick: () => setSelections(_.map(_.set('isSelected', false))) }, ['none']),
    ]),
    div({ style: { flex: 1, marginBottom: '3rem' } }, [
      h(AutoSizer, [
        ({ width, height }) => {
          return h(List, {
            height,
            width,
            rowCount: selections.length,
            deferredMeasurementCache: cache,
            rowHeight: cache.rowHeight,
            noRowsRenderer: () => noRowsMessage,
            rowRenderer: ({ index, style, key, parent }) => {
              const { filePath, isSelected } = selections[index];

              // Show the file name, i.e. the last URL path segment, without URL parameters
              const fileName = filePath.split('/').at(-1).split('?')[0];

              return h(
                CellMeasurer,
                {
                  cache,
                  columnIndex: 0,
                  key,
                  parent,
                  rowIndex: index,
                },
                [
                  div({ key, style: { ...style, display: 'flex' } }, [
                    h(
                      LabeledCheckbox,
                      {
                        checked: isSelected,
                        onChange: () => toggleSelected(index),
                        style: { padding: '0.5rem' },
                      },
                      [
                        h(
                          Link,
                          {
                            style: {
                              padding: '0.5rem',
                              minWidth: 0,
                              overflow: 'hidden',
                              whiteSpace: 'normal',
                              wordBreak: 'break-all',
                            },
                            tooltip: fileName,
                          },
                          [fileName]
                        ),
                      ]
                    ),
                  ]),
                ]
              );
            },
          });
        },
      ]),
    ]),
    h(ButtonBar, {
      style: Style.modalDrawer.buttonBar,
      okButton: h(
        ButtonPrimary,
        {
          disabled: !isSelectionValid || !isRefGenomeValid,
          tooltip: Utils.cond([!isSelectionValid, () => 'Select at least one file'], [!isRefGenomeValid, () => 'Select a reference genome']),
          onClick: () => {
            addIgvRecentlyUsedReference(refGenome);
            onSuccess({ selectedFiles: _.filter('isSelected', selections), refGenome });
          },
        },
        ['Launch IGV']
      ),
    }),
  ]);
};

export default IGVFileSelector;
