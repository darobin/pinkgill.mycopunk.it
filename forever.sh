#!/bin/bash

# This is meant to be copied to the live server and run there.
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin"
echo "Deploying…"
cd /var/www/pinkgill.mycopunk.it
export NODE_ENV=production
FOREVERID=$(forever list | grep '/var/www/pinkgill.mycopunk.it' | tr -s ' ' | cut -d ' ' -f3)
if [ -z "$FOREVERID" ]; then
  forever start /var/www/pinkgill.mycopunk.it/production.json;
else
  forever restart $FOREVERID;
fi

forever list
echo "Deployment operational."
