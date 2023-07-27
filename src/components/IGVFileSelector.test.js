import { getValidIgvFiles, getValidIgvFilesFromAttributeValues } from 'src/components/IGVFileSelector';

describe('getValidIgvFiles', () => {
  it('allows BAM files with indices', () => {
    expect(
      getValidIgvFiles([
        'gs://bucket/test1.bam',
        'gs://bucket/test2.bam',
        'gs://bucket/test2.bai',
        'gs://bucket/test3.bam',
        'gs://bucket/test3.bam.bai',
      ])
    ).toEqual([
      {
        filePath: 'gs://bucket/test2.bam',
        indexFilePath: 'gs://bucket/test2.bai',
      },
      {
        filePath: 'gs://bucket/test3.bam',
        indexFilePath: 'gs://bucket/test3.bam.bai',
      },
    ]);
  });

  it('allows CRAM files with indices', () => {
    expect(
      getValidIgvFiles([
        'gs://bucket/test1.cram',
        'gs://bucket/test2.cram',
        'gs://bucket/test2.crai',
        'gs://bucket/test3.cram',
        'gs://bucket/test3.cram.crai',
      ])
    ).toEqual([
      {
        filePath: 'gs://bucket/test2.cram',
        indexFilePath: 'gs://bucket/test2.crai',
      },
      {
        filePath: 'gs://bucket/test3.cram',
        indexFilePath: 'gs://bucket/test3.cram.crai',
      },
    ]);
  });

  it('allows VCF files with indices', () => {
    expect(
      getValidIgvFiles([
        'gs://bucket/test1.vcf',
        'gs://bucket/test2.vcf',
        'gs://bucket/test2.idx',
        'gs://bucket/test3.vcf',
        'gs://bucket/test3.vcf.idx',
        'gs://bucket/test4.vcf',
        'gs://bucket/test4.tbi',
        'gs://bucket/test5.vcf',
        'gs://bucket/test5.vcf.tbi',
      ])
    ).toEqual([
      {
        filePath: 'gs://bucket/test2.vcf',
        indexFilePath: 'gs://bucket/test2.idx',
      },
      {
        filePath: 'gs://bucket/test3.vcf',
        indexFilePath: 'gs://bucket/test3.vcf.idx',
      },
      {
        filePath: 'gs://bucket/test4.vcf',
        indexFilePath: 'gs://bucket/test4.tbi',
      },
      {
        filePath: 'gs://bucket/test5.vcf',
        indexFilePath: 'gs://bucket/test5.vcf.tbi',
      },
    ]);
  });

  it('allows BED files', () => {
    expect(getValidIgvFiles(['gs://bucket/test.bed'])).toEqual([
      {
        filePath: 'gs://bucket/test.bed',
        indexFilePath: false,
      },
    ]);
  });

  it('requires GCS URLs', () => {
    expect(getValidIgvFiles(['gs://bucket/test.bed', 'https://example.com/test.bed', 'test.bed'])).toEqual([
      {
        filePath: 'gs://bucket/test.bed',
        indexFilePath: false,
      },
    ]);
  });

  it('allows TDR URLs', () => {
    expect(
      getValidIgvFiles([
        'gs://datarepo-ab123456-bucket/cae37a2a-657f-4b04-9fef-59c215020078/5f5f634d-70f3-4914-9c71-9d14c7f98e60/test.bam',
        'gs://datarepo-ab123456-bucket/cae37a2a-657f-4b04-9fef-59c215020078/2eeff61f-ae9e-41ae-bb40-909ff6bdfba8/test.bam.bai',
      ])
    ).toEqual([
      {
        filePath: 'gs://datarepo-ab123456-bucket/cae37a2a-657f-4b04-9fef-59c215020078/5f5f634d-70f3-4914-9c71-9d14c7f98e60/test.bam',
        indexFilePath: 'gs://datarepo-ab123456-bucket/cae37a2a-657f-4b04-9fef-59c215020078/2eeff61f-ae9e-41ae-bb40-909ff6bdfba8/test.bam.bai',
      },
    ]);
  });
});

describe('getValidIgvFilesFromAttributeValues', () => {
  it('gets all valid files from lists', () => {
    expect(
      getValidIgvFilesFromAttributeValues([
        {
          itemsType: 'AttributeValue',
          items: ['gs://bucket/test1.bed', 'gs://bucket/test2.bed', 'gs://bucket/test3.bed'],
        },
      ])
    ).toEqual([
      {
        filePath: 'gs://bucket/test1.bed',
        indexFilePath: false,
      },
      {
        filePath: 'gs://bucket/test2.bed',
        indexFilePath: false,
      },
      {
        filePath: 'gs://bucket/test3.bed',
        indexFilePath: false,
      },
    ]);
  });
});
