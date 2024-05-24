export type ImportSource = 'anvil' | '';

/**
 * This method identifies an import source. Currently it only identifies AnVIL Explorer.
 */
export const getImportSource = (url: URL): ImportSource => {
  const anvilSources = [
    // AnVIL production
    'service.prod.anvil.gi.ucsc.edu',
    'edu-ucsc-gi-platform-anvil-prod-storage-anvilprod.us-east-1',
    // AnVIL development
    'service.anvil.gi.ucsc.edu',
    'edu-ucsc-gi-platform-anvil-dev-storage-anvildev.us-east-1',
  ];
  if (anvilSources.some((path) => url.href.includes(path))) {
    return 'anvil';
  }
  return '';
};
