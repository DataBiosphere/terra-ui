export interface PipelineOutputDescription {
  helpText: string;
}

export const OUTPUT_DESCRIPTIONS: Record<string, PipelineOutputDescription> = {
  imputedMultiSampleVcf: {
    helpText: 'Lorem ipsum bla bla bla',
  },
  imputedMultiSampleVcfIndex: {
    helpText: 'Lorem ipsum bla bla bla bla bla bla bla bla bla bla bla bla bla bla ',
  },
  chunksInfo: {
    helpText: 'this output is sick !',
  },
};
