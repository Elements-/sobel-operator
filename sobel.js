var PNG = require('node-png').PNG;
var fs = require('fs');

var png = new PNG({
  filterType: -1
});

src = fs.createReadStream('image.png'),
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

png.on('parsed', function() {
  //console.log(png);
  var newData = new Buffer(png.width*png.height);

  for(var y = 1; y+1 < png.height; y ++) {
    for(var x = 1; x+1 < png.width; x ++) {
      var idx = (png.width * y + x) << 2;
      var r = png.data[idx];
      var g = png.data[idx+1];
      var b = png.data[idx+2];
      var a = png.data[idx+3];

      var avg = Math.floor((r + g + b) / 3);

      var xbump = 0;
      var ybump = 0;

      for(var xOffset = -1; xOffset <= 1; xOffset++) {
        for(var yOffset = -1; yOffset <= 1; yOffset++) {
          var pixelIndex = (png.width * (y+yOffset) + (x+xOffset)) << 2;
          xbump += png.data[pixelIndex] * xderivatives[yOffset+1][xOffset+1];
          ybump += png.data[pixelIndex] * yderivatives[yOffset+1][xOffset+1];
        }
      }

      var pixelBump = Math.floor(Math.sqrt(Math.pow(xbump, 2) + Math.pow(ybump, 2)) / 3);

      newData[idx] = pixelBump;
      newData[idx+1] = pixelBump;
      newData[idx+2] = pixelBump;

      console.log('Pixel:', r,g,b,a, pixelBump);

      if(x+2 == png.width && y+2 == png.height) {
        console.log('\n\n\n\n\n\n\ndone');
        exportPng(newData);
      }
    }
  }
  console.log('done');
});

function exportPng(newData) {
  png.data = newData;
  png.pack().pipe(dst);
  //process.exit(0);
}

src.pipe(png);

/**PNG.decode('image.png', function(pixels) {
    console.log(pixels);
    var greyscaleImage = [];
    for(var i = 0; i < pixels.length; i += 4) {
      var avg = Math.floor((pixels[i] + pixels[i+1] + pixels[i+2] + pixels[i+3]) / 4);
      console.log(avg);
    }
});**/
