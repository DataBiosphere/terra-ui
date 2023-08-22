import _ from 'lodash/fp';
import React from 'react';
import { h } from 'react-hyperscript-helpers';
import { SingleValue } from 'react-select';
import { ComputeImage } from 'src/analysis/useComputeImages';
import { GroupedSelect } from 'src/components/common';

export interface GcpComputeImageSelectProps {
  readonly selectedComputeImageUrl: string;
  readonly setSelectedComputeImageUrl: (value: string) => void;
  readonly images: ComputeImage[];
  readonly hasCustomOption: boolean;
  readonly customOptionUrl: string;
}

interface ImageSelectOption {
  value: string;
  label?: string;
}

export const GcpComputeImageSelect: React.FC<GcpComputeImageSelectProps> = (props: GcpComputeImageSelectProps) => {
  const { selectedComputeImageUrl, setSelectedComputeImageUrl, images, hasCustomOption, customOptionUrl } = props;

  const filterImages: (predicate: any) => ImageSelectOption[] = (predicate) =>
    _.flow(
      () => images,
      _.filter(predicate),
      _.map(({ label, url }) => ({ label, value: url }))
    )();

  return h(GroupedSelect, {
    'aria-label': 'Select Environment',
    maxMenuHeight: 25,
    value: selectedComputeImageUrl,
    onChange: ({ value }: SingleValue<any>) => {
      setSelectedComputeImageUrl(value);
    },
    isSearchable: true,
    isClearable: false,
    options: [
      {
        label: 'TERRA-MAINTAINED JUPYTER ENVIRONMENTS',
        options: filterImages(({ isCommunity, isRStudio }) => !isCommunity && !isRStudio),
      },
      {
        label: 'COMMUNITY-MAINTAINED JUPYTER ENVIRONMENTS (verified partners)',
        options: filterImages(_.get(['isCommunity'])),
      },
      {
        label: 'COMMUNITY-MAINTAINED RSTUDIO ENVIRONMENTS (verified partners)',
        options: filterImages(_.get(['isRStudio'])),
      },
      ...(hasCustomOption
        ? [
            {
              label: 'OTHER ENVIRONMENTS',
              options: [{ label: 'Custom Environment', value: customOptionUrl }],
            },
          ]
        : []),
    ],
  });
};
