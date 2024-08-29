import {
  makeDisksHelper,
  makeLeoDisksV1DataClient,
  makeLeoDisksV2DataClient,
} from '@terra-ui-packages/leonardo-data-client';
import { withAuthSession } from 'src/auth/auth-session';
import { fetchLeo } from 'src/libs/ajax/ajax-common';
import { withAppIdentifier } from 'src/libs/ajax/fetch/fetch-core';

export const Disks = makeDisksHelper({
  v1Api: makeLeoDisksV1DataClient({
    fetchAuthedLeo: withAuthSession(withAppIdentifier(fetchLeo)),
  }),
  v2Api: makeLeoDisksV2DataClient({
    fetchAuthedLeo: withAuthSession(withAppIdentifier(fetchLeo)),
  }),
});

export type DisksDataClientContract = ReturnType<typeof Disks>;
export type DisksContractV1 = ReturnType<DisksDataClientContract['disksV1']>;
export type DisksContractV2 = ReturnType<DisksDataClientContract['disksV2']>;
export type DiskWrapperContract = ReturnType<DisksContractV1['disk']>;
