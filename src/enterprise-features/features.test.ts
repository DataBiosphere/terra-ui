import { act } from '@testing-library/react';
import {
  BROAD_ON_MANIFOLD_ENTERPRISE_FEATURE_ID,
  userHasAccessToEnterpriseFeature,
} from 'src/enterprise-features/features';
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
  it('knows the Broad on Manifold feature', async () => {
    // Arrange
    await act(async () => {
      userStore.update((state: TerraUserState) => ({ ...state, enterpriseFeatures: ['broad-on-manifold'] }));
    });

    // Act
    const hasAccess = userHasAccessToEnterpriseFeature(BROAD_ON_MANIFOLD_ENTERPRISE_FEATURE_ID);
    // Assert
    expect(hasAccess).toBe(true);
  });
});
