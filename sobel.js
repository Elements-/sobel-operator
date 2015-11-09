var PNG = require('node-png').PNG;
var fs = require('fs');
var moment = require('moment');
var async = require('async');

var png = new PNG({
  filterType: -1
});

src = fs.createReadStream('tiger.png'),
dst = fs.createWriteStream('/var/www/elmnts.co/image-processed.png');

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

var getBump = function(x, y) {
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
  console.log('Loaded image in ' + loadTime + 'ms, processed in ' + processTime + 'ms (' + Math.floor((png.width * png.height) /  processTime) + ' px/s)');
}

var asyncThreads = [];
var threads = process.argv[2];

var pixelsPerThread = Math.floor((png.width * png.height) / threads);

png.on('parsed', function() {
  timeData.endRead = moment().valueOf();
  var newData = new Buffer(png.width*png.height*4);

  var handle = function(startY, endY, width, callback) {
    var chunk = new Buffer(width * (endY-startY));
    console.log('here', startY, endY);

    for(var y = startY; y < endY; y ++) {
      for(var x = 0; x < width; x++) {
        var index = ((y-startY)*width) + x;
        var bump = getBump(x, y);
        chunk[index] = bump;
      }
    }
    callback(null, chunk);
  }

  for(var threadNum = 0; threadNum < threads; threadNum++) {
    var startY = Math.floor(png.height / threads) * threadNum;
    var endY = startY + Math.floor(png.height / threads);
    asyncThreads.push(handle.bind(null, startY, endY, png.width));
  }

  async.parallel(asyncThreads, function(err, results) {
    var currentIndex = 0;
    for(var i = 0; i < results.length; i++) {
      for(var k = 0; k < results[i].length; k++) {
        for(var color = 0; color <= 2; color++) {
          newData[currentIndex+color] = results[i][k];
        }
        newData[currentIndex+3] = 255;
        currentIndex += 4;
      }
    }
    console.log(newData);
    timeData.endProcess = moment().valueOf();
    exportPng(newData);
    printStats();
  });
});


function exportPng(newData) {
  png.data = newData;
  png.pack().pipe(dst);
}

src.pipe(png);
