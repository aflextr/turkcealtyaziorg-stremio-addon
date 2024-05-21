#!/usr/bin/env node

var ass2srt = require('./');
var minimist = require('minimist');
var fs = require('fs');

var argv = minimist(process.argv.slice(2), {
  alias: {out:'o', help:'h'},
  default: {out:'-'}
});

var filename = argv._[0];
if(argv.help || !filename) {
  console.error('Usage: ass2srt input.ass [-o output.src]')
  process.exit(1)
}

process.stdout.on('error', function(err) {
  if(err.code !== 'EPIPE') throw err
})

fs.readFile(filename, function(err, data) {
  if(err) return console.error(err.message);
  
  var output = ass2srt(data);
  if(argv.out === '-') return console.log(output);

  fs.writeFile(argv.out, output, function(err) {
    if(err) return console.error(err);
    console.log('convert ' + filename + ' to ' + argv.out + ' success');
  });
});
