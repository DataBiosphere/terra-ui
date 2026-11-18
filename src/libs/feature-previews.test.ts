import { CurrentUserGroupMembership, Groups, GroupsContract } from 'src/libs/ajax/Groups';
import { Metrics, MetricsContract } from 'src/libs/ajax/Metrics';
import { AppConfigSettings, getConfig } from 'src/libs/config';
import Events from 'src/libs/events';
import { getAvailableFeaturePreviews, isFeaturePreviewEnabled, toggleFeaturePreview } from 'src/libs/feature-previews';
import { getLocalPref, setLocalPref } from 'src/libs/prefs';
import { userStore } from 'src/libs/state';
import { asMockedFn, MockedFn, partial } from 'src/testing/test-utils';

jest.mock('src/libs/ajax/Groups');
jest.mock('src/libs/ajax/Metrics');

jest.mock('src/libs/config', () => ({
  ...jest.requireActual('src/libs/config'),
  getConfig: jest.fn().mockReturnValue({}),
}));
jest.mock('src/libs/feature-previews-config', () => ({
  __esModule: true,
  default: [
    {
      id: 'feature1',
      title: 'Feature #1',
      description: 'A new feature',
    },
    {
      id: 'feature2',
      title: 'Feature #2',
      description: 'Another new feature',
      groups: ['preview-group'],
    },
    {
      id: 'feature3',
      title: 'Feature #3',
      description: 'A feature for one organization',
      emailDomains: ['example.org'],
    },
  ],
}));
jest.mock('src/libs/prefs');

beforeEach(() => {
  asMockedFn(getConfig).mockReturnValue(partial<AppConfigSettings>({ isProd: true }));
});

describe('isFeaturePreviewEnabled', () => {
  it('reads from local preference', () => {
    // Arrange
    asMockedFn(getLocalPref).mockReturnValue(true);

    // Act
    const result = isFeaturePreviewEnabled('test-feature');

    // Assert
    expect(result).toBe(true);
    expect(getLocalPref).toHaveBeenCalledWith('feature-preview/test-feature');
  });
});

describe('toggleFeaturePreview', () => {
  it('sets local preference', () => {
    // Arrange
    asMockedFn(Metrics).mockReturnValue(partial<MetricsContract>({ captureEvent: jest.fn() }));

    // Act
    toggleFeaturePreview('test-feature', false);

    // Assert
    expect(setLocalPref).toHaveBeenCalledWith('feature-preview/test-feature', false);
  });

  it('captures metrics', () => {
    // Arrange
    const captureEvent: MockedFn<MetricsContract['captureEvent']> = jest.fn();
    asMockedFn(Metrics).mockReturnValue(partial<MetricsContract>({ captureEvent }));

    // Act
    toggleFeaturePreview('test-feature', true);

    // Assert
    expect(captureEvent).toHaveBeenCalledWith(Events.featurePreviewToggle, {
      featureId: 'test-feature',
      enabled: true,
    });
  });
});

describe('getAvailableFeaturePreviews', () => {
  it("should return available feature previews based on user's groups", async () => {
    // Arrange
    asMockedFn(getLocalPref).mockReturnValue(false);

    asMockedFn(Groups).mockReturnValue(
      partial<GroupsContract>({
        list: jest.fn(async () => []),
      })
    );

    // Act
    const result1 = await getAvailableFeaturePreviews();

    asMockedFn(Groups).mockReturnValue(
      partial<GroupsContract>({
        list: jest.fn(async () => [
          partial<CurrentUserGroupMembership>({
            groupName: 'preview-group',
            groupEmail: 'preview-group@test.firecloud.org',
            role: 'member',
          }),
        ]),
      })
    );

    const result2 = await getAvailableFeaturePreviews();

    // Assert
    expect(result1).toEqual([
      {
        id: 'feature1',
        title: 'Feature #1',
        description: 'A new feature',
      },
    ]);
    expect(result2).toEqual([
      {
        id: 'feature1',
        title: 'Feature #1',
        description: 'A new feature',
      },
      {
        id: 'feature2',
        title: 'Feature #2',
        description: 'Another new feature',
        groups: ['preview-group'],
      },
    ]);
  });

  it('should include enabled feature previews regardless of group', async () => {
    // Arrange
    asMockedFn(getLocalPref).mockImplementation((key) => key === 'feature-preview/feature2');

    asMockedFn(Groups).mockReturnValue(
      partial<GroupsContract>({
        list: jest.fn(async () => []),
      })
    );

    // Act
    const result = await getAvailableFeaturePreviews();

    // Assert
    expect(result).toEqual([
      {
        id: 'feature1',
        title: 'Feature #1',
        description: 'A new feature',
      },
      {
        id: 'feature2',
        title: 'Feature #2',
        description: 'Another new feature',
        groups: ['preview-group'],
      },
    ]);
  });

  it('should include all feature previews in non-production environments', async () => {
    // Arrange
    asMockedFn(getConfig).mockReturnValue(partial<AppConfigSettings>({ isProd: false }));
    asMockedFn(getLocalPref).mockReturnValue(false);

    asMockedFn(Groups).mockReturnValue(
      partial<GroupsContract>({
        list: jest.fn(async () => []),
      })
    );

    // Act
    const result = await getAvailableFeaturePreviews();

    // Assert
    expect(result).toEqual([
      {
        id: 'feature1',
        title: 'Feature #1',
        description: 'A new feature',
      },
      {
        id: 'feature2',
        title: 'Feature #2',
        description: 'Another new feature',
        groups: ['preview-group'],
      },
      {
        id: 'feature3',
        title: 'Feature #3',
        description: 'A feature for one organization',
        emailDomains: ['example.org'],
      },
    ]);
  });

  describe('with emailDomains', () => {
    const setUserEmail = (email: string | undefined) =>
      userStore.update((state) => ({ ...state, terraUser: { ...state.terraUser, email } }));

    const availableIds = async () => {
      asMockedFn(Groups).mockReturnValue(partial<GroupsContract>({ list: jest.fn(async () => []) }));
      return (await getAvailableFeaturePreviews()).map(({ id }) => id);
    };

    it.each([
      { email: 'someone@example.org', shown: true },
      { email: 'Someone@Example.ORG', shown: true },
      { email: 'someone@other.org', shown: false },
      { email: 'someone@notexample.org', shown: false },
      { email: 'someone@example.org.other.com', shown: false },
      { email: undefined, shown: false },
    ])('shows the preview to $email: $shown', async ({ email, shown }) => {
      // Arrange
      asMockedFn(getLocalPref).mockReturnValue(false);
      setUserEmail(email);

      // Act
      const ids = await availableIds();

      // Assert
      expect(ids.includes('feature3')).toBe(shown);
    });

    it('still shows an enabled preview, so it can be turned off', async () => {
      // Arrange
      asMockedFn(getLocalPref).mockImplementation((key) => key === 'feature-preview/feature3');
      setUserEmail('someone@other.org');

      // Act
      const ids = await availableIds();

      // Assert
      expect(ids).toContain('feature3');
    });
  });
});
