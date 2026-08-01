// Imports the built output (dist/), not the TS source — Vercel's serverless
// bundler doesn't rewrite the `@/*` path aliases used throughout src/ the way
// ts-node (dev) and tsc-alias (the build step) do, so importing raw source
// here fails at runtime with "Cannot find module '@/config/env'". dist/ is
// already alias-resolved to plain relative paths by tsc-alias.
import { createApp } from '../dist/app';

export default createApp();
