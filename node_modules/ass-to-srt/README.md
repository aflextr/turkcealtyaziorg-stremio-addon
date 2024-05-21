# ASS to SRT
ass subtitle to srt format 

## Install
```
npm install -g ass-to-srt
```

## Usage
```
ass2srt input.ass -o output.srt
```

## Example
```
var ass2srt = require('ass-to-srt');
var fs = require('fs');

fs.openFile('input.ass', function(err, data) {
  var output = ass2srt(data);
  console.log(output);
});
```
