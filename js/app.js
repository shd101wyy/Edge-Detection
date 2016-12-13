class EdgeDetection {
  constructor(canvas) {
    this.canvas = canvas
    this.context = this.canvas.getContext('2d')

    this.tmpCanvas = document.createElement('canvas')
    this.tmpContext = this.tmpCanvas.getContext('2d')
  }

  loadImage(src) {
    this.src = src
    this.image = new Image()
    this.image.src = src
    this.image.onload = this.drawImage.bind(this)
    this.image.crossOrigin = 'anonymous';
  }

  drawImage() {
    const width = this.image.width
    const height = this.image.height

    this.canvas.width = width
    this.canvas.height = height

    this.context.drawImage(this.image, 0, 0)

    // this.imageData = this.context.getImageData(0, 0, width, height)

    // Sobel constructor returns an Uint8ClampedArray with sobel data
    // const sobelData = Sobel(imageData);

    // [sobelData].toImageData() returns a new ImageData object
    // const sobelImageData = sobelData.toImageData();
    // context.putImageData(sobelImageData, 0, 0);
  }

  greyscale() {
    const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height),
          data = imageData.data

    for (let i = 0; i < data.length; i+= 4) { // r,g,b,a
      const r = data[i],
            g = data[i + 1],
            b = data[i + 2]
      // const luminosity = 0.21*r + 0.72*g + 0.07*b
      const luminosity = 0.2126*r + 0.7152*g + 0.0722*b;

      data[i] = luminosity
      data[i + 1] = luminosity
      data[i + 2] = luminosity
    }

    // ovewrite old imageData
    this.context.putImageData(imageData, 0, 0)
  }

  invert() {
    const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height),
          data = imageData.data

    for (let i = 0; i < data.length; i += 4) { // r,g,b,a
      const r = 255 - data[i],
            g = 255 - data[i + 1],
            b = 255 - data[i + 2]

      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
    }

    // ovewrite old imageData
    this.context.putImageData(imageData, 0, 0)
  }

  sharpen() {
    const kernel = [[0, -1, 0],
                    [-1, 5, -1],
                    [0, -1, 0]]
    const imageData = this.convolve(kernel)
    this.context.putImageData(imageData, 0, 0)
  }

  gaussian(sigma=0.7, size=5) { // gaussian filter
    const kernel = this.generateGaussianKernel(sigma, size)
    const imageData = this.convolve(kernel)
    this.context.putImageData(imageData, 0, 0)
  }

  generateGaussianKernel(sigma, size) {
    // this function is referred and modified from
    // https://github.com/cmisenas/canny-edge-detection/blob/master/js/filters.js

    const kernel = []
    const E = 2.718 //Euler's number rounded of to 3 places
    let sum = 0
    for (let y = -(size - 1)/2, i = 0; i < size; y++, i++) {
      kernel[i] = [];
      for (let x = -(size - 1)/2, j = 0; j < size; x++, j++) {
        // create kernel round to 3 decimal places
        kernel[i][j] = 1/(2 * Math.PI * Math.pow(sigma, 2)) * Math.pow(E, -(Math.pow(Math.abs(x), 2) + Math.pow(Math.abs(y), 2))/(2 * Math.pow(sigma, 2)))
        sum += kernel[i][j]
      }
    }
    //normalize the kernel to make its sum 1
    const normalize = 1/sum
    for (let k = 0; k < kernel.length; k++) {
      for (let l = 0; l < kernel[k].length; l++) {
        kernel[k][l] = Math.round(normalize * kernel[k][l] * 1000)/1000
      }
    }
    return kernel
  }

  /**
   sobel kernel
    x:  [[-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1]],
    y:  [[-1, -2, -1],
        [0, 0, 0],
        [1, 2, 1]]
   */
  convolve(kernel, opaque=false) {
    const side = kernel.length
    const halfSide = Math.floor(side / 2)// Math.round(side / 2)
    const pixels = this.getPixels()
    const src = pixels.data,
          sw = pixels.width,
          sh = pixels.height

    const w = sw,
          h = sh

    const output = this.createImageData()
    const dst = output.data

    const alphaFactor = opaque ? 1 : 0

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const sy = y
        const sx = x
        const dstOffset = (y*w+x)*4
        // calculate the weighed sum of the source image pixels that
        // fall under the convolution matrix
        let r = 0, g = 0, b = 0, a = 0
        for (let cy = 0; cy < side; cy++) {
          for (let cx = 0; cx < side; cx++) {
            const weight = kernel[cy][cx]

            const scy = sy + cy - halfSide
            const scx = sx + cx - halfSide
            if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
              const srcOffset = (scy*sw+scx)*4
              r += src[srcOffset] * weight
              g += src[srcOffset+1] * weight
              b += src[srcOffset+2] * weight
              a += src[srcOffset+3] * weight
            }
          }
        }

        dst[dstOffset] = r
        dst[dstOffset+1] = g
        dst[dstOffset+2] = b
        dst[dstOffset+3] = a + alphaFactor*(255-a)
      }
    }
    return output
  }

  resetImage() {
    this.context.drawImage(this.image, 0, 0)
  }

  createImageData() {

    return this.tmpContext.createImageData(this.canvas.width, this.canvas.height)
  }

  getPixels() {
    return this.context.getImageData(0, 0, this.canvas.width, this.canvas.height)
  }

  operator(kernelX, kernelY) {
    const pixelX = this.convolve(kernelX)
    const pixelY = this.convolve(kernelY)

    const finalImage = this.createImageData()
    for (let i = 0; i < finalImage.data.length; i+= 4) {
      const magnitude = Math.sqrt(pixelX.data[i] * pixelX.data[i] + pixelY.data[i] * pixelY.data[i])
      finalImage.data[i] = magnitude
      finalImage.data[i+1] = magnitude
      finalImage.data[i+2] = magnitude
      finalImage.data[i+3] = 255; // opaque alpha

      /*
      // make the pixelX gradient red
      const v = Math.abs(pixelX.data[i]);
      finalImage.data[i] = v;
      // make the pixelY gradient green
      const h = Math.abs(pixelY.data[i]);
      finalImage.data[i+1] = h;
      // and mix in some blue for aesthetics
      finalImage.data[i+2] = (v+h)/4;
      finalImage.data[i+3] = 255; // opaque alpha
      */
    }

    this.context.putImageData(finalImage, 0, 0)
  }

  sobel() {
    return this.operator(
      [[-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1]],

      [[-1, -2, -1],
        [0,  0,  0],
        [1,  2,  1]]
    )
  }

  roberts() {
    return this.operator(
      [[1, 0],
       [0, -1]],
      [[0, 1],
       [-1, 0]]
    )
  }

  prewitt() {
    return this.operator(
      [[-1, 0, 1],
       [-1, 0, 1],
       [-1, 0, 1]],
      [[1, 1, 1],
       [0, 0, 0],
       [-1, -1, -1]]
    )
  }

  scharr() {
    return this.operator(
      [[3, 10, 3],
       [0, 0, 0],
       [-3, -10, -3]],

      [[3, 0, -3],
       [10, 0, -10],
       [3,  0,  -3]]
    )
  }

}

(function() {
  const edgeDetection = new EdgeDetection(document.getElementById('image-canvas'))

  // edgeDetection.loadImage('images/IMG4622.jpg')
  edgeDetection.loadImage('images/demo_small.png')

  document.getElementById('greyscale').addEventListener('click', function() {
    edgeDetection.greyscale()
  })

  document.getElementById('gaussian-blur').addEventListener('click', function() {
    edgeDetection.gaussian()
  })

  document.getElementById('reset').addEventListener('click', function() {
    edgeDetection.resetImage()
  })

  document.getElementById('sharpen').addEventListener('click', function() {
    edgeDetection.sharpen()
  })

  document.getElementById('invert').addEventListener('click', function() {
    edgeDetection.invert()
  })

  document.getElementById('sobel').addEventListener('click', function() {
    edgeDetection.sobel()
  })

  document.getElementById('roberts').addEventListener('click', function() {
    edgeDetection.roberts()
  })

  document.getElementById('prewitt').addEventListener('click', function() {
    edgeDetection.prewitt()
  })

  document.getElementById('scharr').addEventListener('click', function() {
    edgeDetection.scharr()
  })
})()