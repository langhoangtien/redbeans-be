#!/usr/bin/env bash
set -e
/opt/wait-for-it.sh mongo:27017
npm run start
