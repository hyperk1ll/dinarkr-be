#!/bin/bash
# deploy-be.sh
# Navigate to the backend directory relative to this script
cd "$(dirname "$0")" || exit

echo "Starting Backend Deployment..."
git pull origin master
npm install
pm2 restart backend --update-env
echo "Backend Deployment Complete!"
