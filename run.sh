#!/usr/bin/bash

./clean.sh

npm install

npm run build

npx wrangler pages dev ./dist --ip 0.0.0.0 --port 3001
