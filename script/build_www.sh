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

cat js/bolig.js js/diagram.js > js/tmp.js

rm -fR js/bolig.js js/diagram.js

java -jar $ROOT'/git-private/compiler.jar' --compilation_level SIMPLE_OPTIMIZATIONS --js $TEMP'www/js/tmp.js' --js_output_file $TEMP'www/js/bolig.js'

rm -fR js/tmp.js

cd $TEMP

tar -cvzf boligrobot.tgz www/

gsutil cp boligrobot.tgz gs://7d4cb438-7016-11e9-beba-5b07bd1875af/tmp



