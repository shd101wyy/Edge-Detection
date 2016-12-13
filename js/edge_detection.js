class EdgeDetection {
  constructor(canvas) {
    this.canvas = canvas
    this.context = this.canvas.getContext('2d')

    this.tmpCanvas = document.createElement('canvas')
    this.tmpContext = this.tmpCanvas.getContext('2d')

    this.magnitudes = []
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
  }

  generateMatrix(width, height, initialValue) {
    const matrix = []
    for (let i = 0; i < height; i++) {
      matrix.push([])
      for (let j = 0; j < width; j++) {
        matrix[i].push(initialValue)
      }
    }
    return matrix
  }

  getNeighorMagnitudes(x, y, size) {
    const neighbors = this.generateMatrix(size, size, 0)
    const halfSize = Math.floor(size / 2)
    for (let j = 0; j < size; j++) {
      // neighbors[i] = []
      for (let i = 0; i < size; i++) {
        const trnsX = x - halfSize + i
        const trnsY = y - halfSize + j
        const pixelOffset = this.toPixelOffset(trnsX, trnsY)
        if (this.magnitudes[pixelOffset]) {
          neighbors[j][i] = this.magnitudes[pixelOffset]
        } else {
          neighbors[j][i] = 0
        }
      }
    }
    return neighbors
  }

  toPixelOffset(x, y) {
    return (y * this.canvas.width + x)
  }

  eachPixel(neighborSize, callback) { // (x, y, current, neighbors)
    const width = this.canvas.width,
          height = this.canvas.height
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const current = this.magnitudes[this.toPixelOffset(x, y)]
        const neighbors = this.getNeighorMagnitudes(x, y, neighborSize)
        callback(x, y, current, neighbors)
      }
    }
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

  gaussian(sigma=1.4, size=5) { // gaussian filter
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

    this.magnitudes = []
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

    this.magnitudes = []

    const finalImage = this.createImageData()
    for (let i = 0; i < finalImage.data.length; i+= 4) {
      const magnitude = Math.sqrt(pixelX.data[i] * pixelX.data[i] + pixelY.data[i] * pixelY.data[i])
      finalImage.data[i] = magnitude
      finalImage.data[i+1] = magnitude
      finalImage.data[i+2] = magnitude
      finalImage.data[i+3] = 255; // opaque alpha

      this.magnitudes.push(magnitude)

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

  drawMagnitudes() {
    const finalImage = this.createImageData()
    for (let i = 0; i < this.magnitudes.length; i++) {
      const n = i * 4, magnitude = this.magnitudes[i]
      finalImage.data[n] = magnitude
      finalImage.data[n+1] = magnitude
      finalImage.data[n+2] = magnitude
      finalImage.data[n+3] = 255; // opaque alpha
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

  nonMaximumSuppression() {
    if (!this.magnitudes.length) return
    const magnitudes = this.magnitudes.slice(0)
    this.eachPixel(3, (x, y, c, n)=> {
      const pixelOffset = this.toPixelOffset(x, y)
      if (n[1][1] > n[0][1] && n[1][1] > n[2][1]) {
        magnitudes[pixelOffset] = n[1][1]
      } else {
        magnitudes[pixelOffset] = 0
      }

      if (n[1][1] > n[0][2] && n[1][1] > n[2][0]) {
        magnitudes[pixelOffset] = n[1][1]
      } else {
        magnitudes[pixelOffset] = 0
      }

      if (n[1][1] > n[1][0] && n[1][1] > n[1][2]) {
        magnitudes[pixelOffset] = n[1][1]
      } else {
        magnitudes[pixelOffset] = 0
      }

      if (n[1][1] > n[0][0] && n[1][1] > n[2][2]) {
        magnitudes[pixelOffset] = n[1][1]
      } else {
        magnitudes[pixelOffset] = 0
      }
    })
    this.magnitudes = magnitudes
    this.drawMagnitudes()
  }

  // low threshold, and high threshold
  hysteresis(lt=100, ht=150) {
    const isStrong = (edge)=> edge > ht
    const isCandidate = (edge)=> edge <= ht && edge >= lt
    const isWeak = (edge)=> edge < lt

    // discard weak edges, pick up strong ones
    const magnitudes = this.magnitudes.slice(0)
    this.eachPixel(3, (x, y, c, n)=> {
      const pixelOffset = this.toPixelOffset(x, y)
      if (isStrong(c)) {
        magnitudes[pixelOffset] = 255
      } else {
        magnitudes[pixelOffset] = 0
      }
    })
    this.magnitudes = magnitudes

    // traverse over candidate edges connected to strong ones
    const traverseEdge = (x, y)=> {
      if (x === 0 || y === 0 || x === this.canvas.width - 1 || y === this.canvas.height - 1) return
      const pixelOffset = this.toPixelOffset(x, y)
      if (isStrong(magnitudes[pixelOffset])) {
        const neighbors = this.getNeighorMagnitudes(x, y, 3)
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            if (isCandidate(neighbors[i][j])) {
              magnitudes[this.toPixelOffset(x-1+i, y-1+j)] = 255
              traverseEdge(x-1+i, y-1+j)
            }
          }
        }
      }
    }

    this.eachPixel(3, traverseEdge)

    // discard others
    this.eachPixel(1, (x, y, current)=> {
      if (!isStrong(current)) {
        magnitudes[this.toPixelOffset(x, y)] = 0
      }
    })

    this.drawMagnitudes()
  }
}
