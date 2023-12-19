import { DeepPartial } from '@terra-ui-packages/core-utils';
import { asMockedFn } from '@terra-ui-packages/test-utils';
import { PersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models';
import { ListRuntimeItem } from 'src/libs/ajax/leonardo/models/runtime-models';
import { getTerraUser, TerraUser } from 'src/libs/state';

import { leoResourcePermissions } from './environmentsPermissions';

jest.mock('src/libs/state', () => ({
  ...jest.requireActual('src/libs/state'),
  getTerraUser: jest.fn(),
}));
describe('environmentsPermissions', () => {
  it('allows disk delete for permitted user', () => {
    // Arrange
    asMockedFn(getTerraUser).mockReturnValue({
      email: 'me@here.org',
    } as Partial<TerraUser> as TerraUser);

    const myDisk: PersistentDisk = {
      auditInfo: { creator: 'me@here.org' },
    } as DeepPartial<PersistentDisk> as PersistentDisk;

    // Act
    const canIDeleteDisk = leoResourcePermissions.canDeleteDisk(myDisk);

    // Assert
    expect(canIDeleteDisk).toBe(true);
  });
  it('blocks disk delete for non-permitted user', () => {
    // Arrange
    asMockedFn(getTerraUser).mockReturnValue({
      email: 'me@here.org',
    } as Partial<TerraUser> as TerraUser);

    const otherDisk: PersistentDisk = {
      auditInfo: { creator: 'you@there.org' },
    } as DeepPartial<PersistentDisk> as PersistentDisk;

    // Act
    const canIDeleteDisk = leoResourcePermissions.canDeleteDisk(otherDisk);

    // Assert
    expect(canIDeleteDisk).toBe(false);
  });
  it('allows resource pause for permitted user', () => {
    // Arrange
    asMockedFn(getTerraUser).mockReturnValue({
      email: 'me@here.org',
    } as Partial<TerraUser> as TerraUser);

    const myRuntime: ListRuntimeItem = {
      auditInfo: { creator: 'me@here.org' },
    } as DeepPartial<ListRuntimeItem> as ListRuntimeItem;

    // Act
    const canIDeleteDisk = leoResourcePermissions.canPauseResource(myRuntime);

    // Assert
    expect(canIDeleteDisk).toBe(true);
  });
  it('blocks resource pausing for non-permitted user', () => {
    // Arrange
    asMockedFn(getTerraUser).mockReturnValue({
      email: 'me@here.org',
    } as Partial<TerraUser> as TerraUser);

    const otherRuntime: ListRuntimeItem = {
      auditInfo: { creator: 'you@there.org' },
    } as DeepPartial<ListRuntimeItem> as ListRuntimeItem;

    // Act
    const canIDeleteDisk = leoResourcePermissions.canPauseResource(otherRuntime);

    // Assert
    expect(canIDeleteDisk).toBe(false);
  });
});
