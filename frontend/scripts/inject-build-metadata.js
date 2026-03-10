#!/usr/bin/env node

/**
 * Build metadata injector - Simple version that works on Windows
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');

function getGitInfo() {
  try {
    const commitSha = process.env.VERCEL_GIT_COMMIT_SHA || execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    const commitRef = process.env.VERCEL_GIT_COMMIT_REF || execSync('git symbolic-ref --short HEAD', { encoding: 'utf-8' }).trim();
    
    return {
      commitHash: commitSha.substring(0, 7),
      branch: commitRef,
      buildTime: new Date().toLocaleString(),
    };
  } catch (error) {
    return {
      commitHash: 'unknown',
      branch: 'unknown',
      buildTime: new Date().toLocaleString(),
    };
  }
}

const gitInfo = getGitInfo();
const packageJson = JSON.parse(fs.readFileSync(path.resolve(projectRoot, 'package.json'), 'utf-8'));
const metadataFile = path.resolve(projectRoot, 'src/constants/buildMetadata.ts');

let metadata = fs.readFileSync(metadataFile, 'utf-8');
metadata = metadata
  .replace(/'__BUILD_TIME__'/g, `'${gitInfo.buildTime}'`)
  .replace(/'__COMMIT_HASH__'/g, `'${gitInfo.commitHash}'`)
  .replace(/'__COMMIT_REF__'/g, `'${gitInfo.branch}'`)
  .replace(/'__ENVIRONMENT__'/g, `'${process.env.NODE_ENV || 'development'}'`);

fs.writeFileSync(metadataFile, metadata);

console.log('[BuildInfo] ✓ Build metadata injected:');
console.log(`  Version: ${packageJson.version}`);
console.log(`  Commit: ${gitInfo.commitHash} (${gitInfo.branch})`);
console.log(`  Built: ${gitInfo.buildTime}`);
