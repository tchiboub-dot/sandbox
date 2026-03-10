/**
 * Build Metadata - Generated at build time
 * This file is auto-generated during the build process
 * It contains information about the current build for debugging
 */

export const BUILD_METADATA = {
  version: '1.0.0',
  buildTime: '__BUILD_TIME__', // Replaced during build
  commitHash: '__COMMIT_HASH__', // Replaced during build
  commitRef: '__COMMIT_REF__', // Replaced during build
  environment: '__ENVIRONMENT__', // Replaced during build
};

/**
 * Format build information for display or logging
 */
export function formatBuildInfo() {
  return `Cloud Device Lab v${BUILD_METADATA.version} | Commit: ${BUILD_METADATA.commitHash} | Built: ${BUILD_METADATA.buildTime}`;
}

/**
 * Get full build details
 */
export function getBuildDetails() {
  return {
    ...BUILD_METADATA,
    deployed: typeof window !== 'undefined', // Is it running in browser?
  };
}
