#! /usr/bin/env node

var sass = require('node-sass');
var fs = require('fs');

var args = process.argv.slice(2);

var callback = null;
var entry = './src/main.scss', paths = [ './src/' ], out = './lib/style.css';
var commandCallbacks = {
  "-entry": function () {
    return function (v) {
      entry = v;
    }
  },
  "-paths": function () {
    paths = [];
    return function nextPath(v) {
      paths.push(v);
      return nextPath;
    }
  },
  "-out": function () {
    return function (v) {
      out = v;
    }
  } 
}
while(args.length) {
  var shifted = args.shift().replace(/[\'\"]/g, '');
  var callbackGen = commandCallbacks[shifted];
  if (!!callbackGen) {
    callback = callbackGen();
  } else if (!!callback) {
    callback = callback(shifted);
  }
}

sass.render({
  file: entry,
  // data: 'body{background:blue; a{color:black;}}',
  includePaths: paths,
  outputStyle: 'compressed',
  outFile: out
}, function(error, result) { // node-style callback from v3.0.0 onwards
  if (!error) {
    fs.writeFile(out, result.css, function(err){
      if(!err){
        //file written on disk
      }
    });
  } else if (error) {
    console.log(error.status); // used to be "code" in v2x and below
    console.log(error.column);
    console.log(error.message);
    console.log(error.line);
  }
});

