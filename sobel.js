var PNG = require('node-png').PNG;
var fs = require('fs');
var moment = require('moment');

var png = new PNG({
  filterType: -1
});

var usage = 'node ' + process.argv[1] + ' <inputPNG> <outputPNG>\ne.x. node ' + process.argv[1] + ' tests/nyc.png result.png';

var src, dst;
try {
  if(fs.lstatSync(process.argv[2]).isFile()) {
    src = fs.createReadStream(process.argv[2]);
  } else {
    console.log(process.argv[2] + 'is not a file.\n\n' + usage);
    process.exit();
  }
  dst = fs.createWriteStream(process.argv[3]);
} catch(err) {
  console.log(err + '\n\n' + usage);
  process.exit();
}
console.log('Processing image...');

var xderivatives = [
  [-1, -2, -1],
  [0, 0, 0],
  [1, 2, 1]
];

var yderivatives = [
  [-1, 0, 1],
  [-2, 0, 2],
  [-1, 0, 1]
];

var timeData = {
  startRead: moment().valueOf(),
  endRead: 0,
  endProcess: 0
}

function getBump(x, y) {
  var xbump = 0;
  var ybump = 0;
  for(var xOffset = -1; xOffset <= 1; xOffset++) {
    for(var yOffset = -1; yOffset <= 1; yOffset++) {
      var idx = getIndex(x + xOffset, y + yOffset);
      var colorWeights = 0;
      for(var color = 0; color <=2; color++) {
        if(png.data[idx+color]) {
          colorWeights += png.data[idx+color]
        } else {
          return 0;
        }
      }
      var greyscale = Math.floor(colorWeights / 3);
      xbump += greyscale * xderivatives[yOffset+1][xOffset+1];
      ybump += greyscale * yderivatives[yOffset+1][xOffset+1];
    }
  }
  var bump = Math.floor(Math.sqrt(Math.pow(xbump, 2) + Math.pow(ybump, 2)) / 3);
  return bump;
}

function getIndex(x, y) {
  return (png.width * y + x) << 2;
}

function printStats() {
  var loadTime = timeData.endRead - timeData.startRead
  var processTime = timeData.endProcess - timeData.endRead;
  console.log('Loaded ' + process.argv[2] + ' in ' + loadTime + 'ms, processed in ' + processTime + 'ms (' + numberWithCommas(Math.floor((png.width * png.height) /  processTime)*1000) + ' pixels/s)');
}

png.on('parsed', function() {
  timeData.endRead = moment().valueOf();
  var newData = new Buffer(png.width*png.height*4);

  for(var y = 0; y < png.height; y ++) {
    for(var x = 0; x < png.width; x ++) {
      var index = getIndex(x, y);
      var bump = getBump(x, y);
      for(var color = 0; color <= 2; color++) {
        newData[index+color] = bump;
      }
      newData[index+3] = 255;
    }
  }
  timeData.endProcess = moment().valueOf();
  exportPng(newData);
  printStats();
});

function exportPng(newData) {
  png.data = newData;
  png.pack().pipe(dst);
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

src.pipe(png);
