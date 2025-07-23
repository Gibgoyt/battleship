#!/usr/bin/bash

## first clean just in case
##./clean.sh
#rm -rf dist node_modules .astro
#rm package-lock.json

# check if 'dist', 'node_modules', '.astro' folders have been successfully deleted
# check if 'package-lock.json' file has been successfully deleted

npm install

# check if 'npm install' worked
npm run build

# if 'npm run build' succeeds AND './dist' folder properly created
# check if wrangler is properly installed
npx wrangler pages dev ./dist