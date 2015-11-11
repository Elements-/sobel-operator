# Sobel Operator

Node.js implementation of the Sobel Operator (Sobel-Feldman operator)
 * Edge Detection (sharp changes in contrast)
 * Standard Sobel X/Y kernels
 * Fast (I was able to process 3 million pixels per second on a laptop)

Currently this is only a CLI application, however its code shouldnt be very difficult to implement elsewhere.

```
node sobel.js input.png output.png
```

### Kernels
![kernels](https://github.com/Elements-/sobel-operator/raw/master/kernels.png)

### Installation
Install the CLI
```
npm install sobel-cli -g
```

Give it a try!
```
node /root/nodejs/sobelOperator/sobel.js tests/nyc.png result.png
```

### Example of the Sobel Operator
Note: This image is very large however it still only took a few seconds to process on a small server.

![unprocessed](https://github.com/Elements-/sobel-operator/raw/master/tests/nyc.png)
![processed](https://github.com/Elements-/sobel-operator/raw/master/result.png)
