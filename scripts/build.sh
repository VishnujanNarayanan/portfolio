#!/bin/sh
# Vercel build (vercel.json buildCommand): copy the site into dist/ and minify the
# shared JS/CSS there. The sources stay commented in the repo; only the deployed
# copies are stripped. main.js/flow.js are classic scripts, so esbuild leaves their
# top-level names alone (flow.js and inline scripts rely on them).
set -eu
rm -rf dist
mkdir dist
tar --exclude=./dist --exclude=./.git --exclude=./.github --exclude=./node_modules -cf - . | tar -xf - -C dist
npx --yes esbuild@0.24.0 dist/main.js dist/flow.js dist/styles.css \
  --minify --outdir=dist --allow-overwrite --log-level=warning
