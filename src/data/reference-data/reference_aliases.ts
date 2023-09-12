import _ from 'lodash/fp';

// A dictionary taking reference alias names to their backend unique name used in workflow inputs
export const RefAliasToName = {
  'Human: hg38': 'hg38',
  'Human: b37': 'b37Human',
  'Monkey: MacMul10': 'Mmul-10',
  'Chimp: PanTrog2': 'Clint-PTRv2',
  'Mouse: GRCm39': 'GRCm39',
  'Rat: RatNorvBN7-2': 'mRatBN7-2',
  'Rat: RatNorvRN6': 'Rnor-6-0',
  'FruitFly: DrosMelan6ISO1': 'Release-6-plus-ISO1-MT',
  'Frog: XenoTropicalis10': 'UCB-Xtro-10-0',
  'Zebrafish: DanioRerio11': 'GRCz11',
  'Nematode: CEle235': 'WBcel235',
  'Yeast: SacchCerevR64': 'R64',
  'Dog: CanLupFamROS1': 'ROS-Cfam-1-0',
  'Dog: CanLupFamGSD1': 'UU-Cfam-GSD-1-0',
  'Pig: SusScrofa11-1': 'Sscrofa11-1',
  'Sheep: OAriesUIRamb2': 'ARS-UI-Ramb-v2-0',
} as const;

export const RefNameToAlias = _.invert(RefAliasToName);
