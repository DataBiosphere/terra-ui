export const referenceMetadata = {
  hg38: {
    species: 'Human',
  },
  b37Human: {
    species: 'Human',
  },
  'Mmul-10': {
    species: 'Monkey',
  },
  'Clint-PTRv2': {
    species: 'Chimp',
  },
  GRCm39: {
    species: 'Mouse',
  },
  'mRatBN7-2': {
    species: 'Rat',
  },
  'Rnor-6-0': {
    species: 'Rat',
  },
  'Release-6-plus-ISO1-MT': {
    species: 'FruitFly',
  },
  'UCB-Xtro-10-0': {
    species: 'Frog',
  },
  GRCz11: {
    species: 'Zebrafish',
  },
  WBcel235: {
    species: 'Nematode',
  },
  R64: {
    species: 'Yeast',
  },
  'ROS-Cfam-1-0': {
    species: 'Dog',
  },
  'UU-Cfam-GSD-1-0': {
    species: 'Dog',
  },
  'Sscrofa11-1': {
    species: 'Pig',
  },
  'ARS-UI-Ramb-v2-0': {
    species: 'Sheep',
  },
};

export const getReferenceLabel = (referenceName) => {
  return `${referenceMetadata[referenceName].species}: ${referenceName}`;
};
