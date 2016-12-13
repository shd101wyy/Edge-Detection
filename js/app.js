(function() {
  const edgeDetection = new EdgeDetection(document.getElementById('image-canvas'))

  // edgeDetection.loadImage('images/IMG4622.jpg')
  // edgeDetection.loadImage('images/fruits.jpg')
  edgeDetection.loadImage('images/anime.jpg')


  document.getElementById('greyscale').addEventListener('click', function() {
    edgeDetection.greyscale()
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

  const imageLoader = document.getElementById('image-loader')
  imageLoader.addEventListener('change', handleImage, false)

  function handleImage(e){
    const reader = new FileReader();
    reader.onload = function(event){
        const img = new Image()
        img.src = event.target.result;

        edgeDetection.loadImage(event.target.result)
    }
    reader.readAsDataURL(e.target.files[0]);
  }

  document.getElementById('upload-image').addEventListener('click', function() {
    imageLoader.click()
  })

  document.getElementById('save-image').addEventListener('click', function() {
    const canvas = document.getElementById('image-canvas')
    // window.open(canvas.toDataURL('image/png'))
    const link = document.getElementById('download-link')
    link.href = canvas.toDataURL();
    link.download = Math.random().toString(36).substr(2, 9) + '.png';
    link.click()
  })

  function beforeNonMaximumSuppression() {
    edgeDetection.resetImage()

    // greyscale
    edgeDetection.greyscale()

    // gaussian blur
    const sigma = parseFloat(document.getElementById('sigma').value) || 1.4
    const size = parseInt(document.getElementById('kernel-size').value) || 5

    edgeDetection.gaussian(sigma, size)

    // calulcate gradiant
    if (document.getElementById('sobel').checked) {
      edgeDetection.sobel()
    } else if (document.getElementById('roberts').checked) {
      edgeDetection.roberts()
    } else if (document.getElementById('prewitt').checked) {
      edgeDetection.prewitt()
    } else if (document.getElementById('scharr').checked) {
      edgeDetection.scharr()
    }

    edgeDetection.drawOnCanvas()
  }

  document.getElementById('calculate-gradiant').addEventListener('click', function() {
    beforeNonMaximumSuppression()
  })

  const detectEdgeBtn = document.getElementById('detect-edge')
  detectEdgeBtn.addEventListener('click', function() {
    if (detectEdgeBtn.classList.contains('running')) return
    detectEdgeBtn.classList.add('running')

    // before non-maximum-suppression
    beforeNonMaximumSuppression()

    // non-maximum-suppression
    edgeDetection.nonMaximumSuppression()

    // hysteresis
    const lt = parseInt(document.getElementById('low-threshold').value) || 50
    const ht = parseInt(document.getElementById('high-threshold').value) || 100
    edgeDetection.hysteresis(lt, ht)

    console.log('done running')
    detectEdgeBtn.classList.remove('running')
  })
})()