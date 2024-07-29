import { GoogleDiskType } from '@terra-ui-packages/leonardo-data-client';
import { ReactNode } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { AboutPersistentDiskSection } from 'src/analysis/modals/ComputeModal/AboutPersistentDiskSection';
import { GcpPersistentDiskSizeNumberInput } from 'src/analysis/modals/ComputeModal/GcpComputeModal/GcpPersistentDiskSizeNumberInput';
import { PersistentDiskTypeInputContainer } from 'src/analysis/modals/ComputeModal/PersistentDiskTypeInputContainer';
import { computeStyles } from 'src/analysis/modals/modalStyles';
import { defaultPersistentDiskType } from 'src/analysis/utils/disk-utils';
import { GooglePdType, googlePdTypes } from 'src/libs/ajax/leonardo/providers/LeoDiskProvider';
import { CloudProvider } from 'src/workspaces/utils';

export const GcpPersistentDiskOptions = [googlePdTypes.standard, googlePdTypes.balanced, googlePdTypes.ssd];

export interface GcpPersistentDiskSectionProps {
  persistentDiskExists: boolean;
  persistentDiskSize: number;
  persistentDiskType: GooglePdType;
  onChangePersistentDiskType: (type: GooglePdType) => void;
  onChangePersistentDiskSize: (size: number) => void;
  onClickAbout: () => void;
  cloudPlatform: CloudProvider;
}

export const GcpPersistentDiskSection = (props: GcpPersistentDiskSectionProps): ReactNode => {
  const {
    onClickAbout,
    persistentDiskType,
    persistentDiskSize,
    onChangePersistentDiskType,
    onChangePersistentDiskSize,
    persistentDiskExists,
  } = props;

  const gridStyle = { display: 'grid', gridGap: '1rem', alignItems: 'center', marginTop: '1rem' };
  return div({ style: { ...computeStyles.whiteBoxContainer, marginTop: '1rem' } }, [
    h(AboutPersistentDiskSection, { onClick: onClickAbout }),
    div({ style: { ...gridStyle, gridGap: '1rem', gridTemplateColumns: '15rem 5.5rem', marginTop: '0.75rem' } }, [
      h(PersistentDiskTypeInputContainer<GoogleDiskType, GooglePdType>, {
        persistentDiskExists,
        value: persistentDiskType.value,
        onChange: (e) => onChangePersistentDiskType(e || defaultPersistentDiskType),
        options: GcpPersistentDiskOptions,
      }),
      h(GcpPersistentDiskSizeNumberInput, {
        persistentDiskSize,
        // GCP disk size may be updated after creation
        isDisabled: false,
        onChangePersistentDiskSize,
      }),
    ]),
  ]);
};
