import _ from 'lodash/fp';

// A dictionary taking reference alias names to their backend unique name used in workflow inputs
export const RefAliasToName = {
  'Human: hg38': 'hg38',
  'Human: b37Human': 'b37Human',
  'Monkey: Mmul-10': 'Mmul-10',
  'Chimp: Clint-PTRv2': 'Clint-PTRv2',
  'Mouse: GRCm39': 'GRCm39',
  'Rat: mRatBN7-2': 'mRatBN7-2',
  'Rat: Rnor-6-0': 'Rnor-6-0',
  'FruitFly: Release-6-plus-ISO1-MT': 'Release-6-plus-ISO1-MT',
  'Frog: UCB-Xtro-10-0': 'UCB-Xtro-10-0',
  'Zebrafish: GRCz11': 'GRCz11',
  'Nematode: WBcel235': 'WBcel235',
  'Yeast: R64': 'R64',
  'Dog: ROS-Cfam-1-0': 'ROS-Cfam-1-0',
  'Dog: UU-Cfam-GSD-1-0': 'UU-Cfam-GSD-1-0',
  'Pig: Sscrofa11-1': 'Sscrofa11-1',
  'Sheep: ARS-UI-Ramb-v2-0': 'ARS-UI-Ramb-v2-0',
} as const;

export const RefNameToAlias = _.invert(RefAliasToName);
