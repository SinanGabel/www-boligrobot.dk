#!/bin/bash


#  . ensure there is a folder called TEMP/

ROOT="/home/""$(whoami)"

WWW=$ROOT"/git-private/www-boligrobot.dk/"

TEMP=$ROOT"/www/TEMP/"

cd $TEMP
rm -fR *

## Copy  to TEMP
cp -R $WWW .

cd www-boligrobot.dk

mv js/bolig.js js/tmp.js

java -jar $ROOT'/git-private/risk-cloud-functions/common/script/compiler.jar' --compilation_level SIMPLE_OPTIMIZATIONS --js $TEMP'www-boligrobot.dk/js/tmp.js' --js_output_file $TEMP'www-boligrobot.dk/js/bolig.js'

rm -fR js/tmp.js js/data.js *.md *.bk* script/ bin/


