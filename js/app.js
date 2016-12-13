(function() {
  const edgeDetection = new EdgeDetection(document.getElementById('image-canvas'))

  // edgeDetection.loadImage('images/IMG4622.jpg')
  edgeDetection.loadImage('images/fruits.jpg')

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

})()