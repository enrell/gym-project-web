const featureFlags = {
  NEW_DASHBOARD_LAYOUT: process.env.NEXT_PUBLIC_ENABLE_NEW_DASHBOARD === 'true',
  // Other feature flags...
}

export function isFeatureEnabled(featureName: keyof typeof featureFlags) {
  return featureFlags[featureName] || false
}