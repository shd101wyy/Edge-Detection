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

    for (let i = 0; i < data.length; i+= 4) { // r,g,b,a
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

  gaussian(sigma=0.7, size=5) { // gaussian filter
    const kernel = this.generateGaussianKernel(sigma, size)
    const imageData = this.convolve(kernel)
    this.context.putImageData(imageData, 0, 0)
    window.imageData = imageData
  }

  generateGaussianKernel(sigma, size) {
    const k = (size - 1)/2;
    const kernel = [];
    const rhoSq = Math.pow(sigma, 2)

    // generate nxn kernel
    for(let i = 0; i < size; i++){
        const krow = [];
        for(let j = 0; j < size; j++){
            // Gaussian formula
            const H = 1 / (2 * Math.PI * rhoSq) *
                        Math.exp(
                            (-1 / (2 * rhoSq)) *
                            (Math.pow(i - k - 1, 2) + Math.pow(j - k - 1, 2)));
            krow.push(H);
        }
        kernel.push(krow);
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
    const halfSide = Math.round(side / 2)
    const pixels = this.getPixels()
    const src = pixels.data,
          sw = pixels.width,
          sh = pixels.height

    const w = sw,
          h = sh

    const output = this.createImageData(w, h)
    const dst = output.data

    const alphaFactor = opaque ? 1 : 0

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const sy = y
        const sx = x
        const distOffet = (y*w+x)*4
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
        dst[distOffet] = r
        dst[distOffet+1] = g
        dst[distOffet+2] = b
        dst[distOffet+3] = a + alphaFactor*(255-a)
      }
    }
    return output
  }

  resetImage() {
    this.context.drawImage(this.image, 0, 0)
  }

  createImageData(width, height) {
    return this.tmpContext.createImageData(width, height)
  }

  getPixels() {
    return this.context.getImageData(0, 0, this.canvas.width, this.canvas.height)
  }
}

(function() {
  const edgeDetection = new EdgeDetection(document.getElementById('image-canvas'))

  edgeDetection.loadImage('images/IMG4622.jpg')
  window.edgeDetection = edgeDetection

  document.getElementById('greyscale').addEventListener('click', function() {
    edgeDetection.greyscale()
  })

  document.getElementById('gaussian-blur').addEventListener('click', function() {
    edgeDetection.gaussian()
  })

  document.getElementById('reset').addEventListener('click', function() {
    edgeDetection.resetImage()
  })
})()