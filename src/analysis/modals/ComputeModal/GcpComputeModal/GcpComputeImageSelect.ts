import React from 'react';
import { h } from 'react-hyperscript-helpers';
import { ComputeImage } from 'src/analysis/useComputeImages';

export interface GcpComputeImageSelectProps {
  readonly selectedComputeImageUrl: string;
  readonly setSelectedComputeImageUrl: (value: string) => void;
  readonly images: ComputeImage[];
  readonly hasCustomOption: boolean;
  readonly customOptionUrl: string;
}

interface ImageSelectOption {
  label: string;
  value: string;
}

export const GcpComputeImageSelect: React.FC<GcpComputeImageSelectProps> = (props: GcpComputeImageSelectProps) => {
  const { selectedComputeImageUrl, setSelectedComputeImageUrl, images, hasCustomOption, customOptionUrl } = props;

  const filterImages: (Function) => ImageSelectOption[] = (predicate) =>
    _.flow(
      _.filter(predicate),
      _.map(({ label, image }) => ({ label, value: image }))
    )(images);

  return h(GroupedSelect, {
    'aria-label': 'Select Environment',
    maxMenuHeight: '25rem',
    value: selectedComputeImageUrl,
    onChange: ({ value }) => {
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
