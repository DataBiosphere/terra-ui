import { act } from '@testing-library/react';
import { userHasAccessToEnterpriseFeature } from 'src/enterprise-features/features';
import { TerraUserState, userStore } from 'src/libs/state';

describe('features', () => {
  describe('when the user has access to an enterprise feature', () => {
    it('says the user has access to that feature', async () => {
      // Arrange
      const userEnterpriseFeatures = ['github-account-linking'];
      await act(async () => {
        userStore.update((state: TerraUserState) => ({ ...state, enterpriseFeatures: userEnterpriseFeatures }));
      });

      // Act
      const hasAccess = userHasAccessToEnterpriseFeature('github-account-linking');
      // Assert
      expect(hasAccess).toBe(true);
    });
  });
  describe('when the user does not have access to an enterprise feature', () => {
    it('says the user does not have access to that feature', async () => {
      // Arrange
      const userEnterpriseFeatures = [];
      await act(async () => {
        userStore.update((state: TerraUserState) => ({ ...state, enterpriseFeatures: userEnterpriseFeatures }));
      });

      // Act
      const hasAccess = userHasAccessToEnterpriseFeature('github-account-linking');
      // Assert
      expect(hasAccess).toBe(false);
    });
  });
  it('it raises an error if the feature is not found', async () => {
    // Arrange
    const userEnterpriseFeatures = [];
    await act(async () => {
      userStore.update((state: TerraUserState) => ({ ...state, enterpriseFeatures: userEnterpriseFeatures }));
    });

    // Act
    const throws = () => userHasAccessToEnterpriseFeature('feature-not-found');
    // Assert
    expect(throws).toThrow(Error);
  });
});
