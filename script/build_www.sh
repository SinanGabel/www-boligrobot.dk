#!/bin/bash


#  . ensure there is a folder called TEMP/

ROOT="/home/""$(whoami)"

WWW=$ROOT"/git-private/www-boligrobot.dk/www/"

TEMP=$ROOT"/www/TEMP/"

cd $TEMP
rm -fR *

## Copy  to TEMP
cp -R $WWW .

cd www

mv js/bolig.js js/tmp.js

java -jar $ROOT'/git-private/risk-cloud-functions/common/script/compiler.jar' --compilation_level SIMPLE_OPTIMIZATIONS --js $TEMP'www/js/tmp.js' --js_output_file $TEMP'www/js/bolig.js'

rm -fR js/tmp.js js/data.js


