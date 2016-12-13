class EdgeDetection {
  constructor(imageCanvas, resultCanvas) {
    this.imageCanvas = imageCanvas
    this.resultCanvas = resultCanvas

    this.imageCanvasContext = this.imageCanvas.getContext('2d')
    this.resultCanvasContext = this.resultCanvas.getContext('2d')
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

    this.imageCanvas.width = width
    this.imageCanvas.height = height

    this.resultCanvas.width = width
    this.resultCanvas.height = height

    this.imageCanvasContext.drawImage(this.image, 0, 0)
    this.resultCanvasContext.drawImage(this.image, 0, 0)

    this.imageData = this.imageCanvasContext.getImageData(0, 0, width, height)

    // Sobel constructor returns an Uint8ClampedArray with sobel data
    // const sobelData = Sobel(imageData);

    // [sobelData].toImageData() returns a new ImageData object
    // const sobelImageData = sobelData.toImageData();
    // context.putImageData(sobelImageData, 0, 0);
  }
}

(function() {
  const edgeDetection = new EdgeDetection(document.getElementById('image-canvas'),
                                          document.getElementById('result-canvas'))

  edgeDetection.loadImage('images/clash.jpg')

})()