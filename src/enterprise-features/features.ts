import { userStore } from 'src/libs/state';

type EnterpriseFeature = {
  id: string;
  name: string;
};

export const BROAD_ON_MANIFOLD_ENTERPRISE_FEATURE_ID = 'broad-on-manifold';

const allFeatures: EnterpriseFeature[] = [
  { id: 'github-account-linking', name: 'GitHub Account Linking' },
  { id: BROAD_ON_MANIFOLD_ENTERPRISE_FEATURE_ID, name: 'Broad on Manifold' },
];

export const userHasAccessToEnterpriseFeature = (feature: string): boolean => {
  const matchingFeature = allFeatures.find((f) => f.id === feature);
  if (!matchingFeature) {
    throw new Error(`Feature ${feature} not found`);
  }
  const userEnterpriseFeatures = userStore.get().enterpriseFeatures;
  return userEnterpriseFeatures?.includes(matchingFeature.id) ?? false;
};
