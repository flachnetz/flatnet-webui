#!/bin/sh

set -e

cd static
echo "Bootstrapping frontend dependencies and stuff"

npm install
node_modules/.bin/bower install
node_modules/.bin/gulp sass
