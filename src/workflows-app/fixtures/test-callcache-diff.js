export const diff = {
  callA: {
    allowResultReuse: true,
    callFqn: 'fetch_sra_to_bam.Fetch_SRA_to_BAM',
    executionStatus: 'Done',
    jobIndex: -1,
    workflowId: 'more-random-value',
  },
  callB: {
    allowResultReuse: true,
    callFqn: 'fetch_sra_to_bam.Fetch_SRA_to_BAM',
    executionStatus: 'Done',
    jobIndex: -1,
    workflowId: 'some-random-uuid',
  },
  hashDifferential: [
    {
      hashKey: 'input:single_link',
      callA: '420C1804A2CB7332995EC8DEC010F17D',
      callB: '8E3354381142EC369FF935DB5C41A808',
    },
  ],
};
