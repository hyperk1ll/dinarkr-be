#!/bin/bash
# deploy-fe.sh
# Navigate to the frontend directory relative to this script
cd "$(dirname "$0")/../dinarkr-fe" || exit

echo "Starting Frontend Deployment..."
git pull origin master
npm install
npm run build
pm2 restart frontend --update-env
echo "Frontend Deployment Complete!"
