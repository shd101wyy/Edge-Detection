# Edge Detection  
Canny edge detection.   
Demo can be found [here](https://rawgit.com/shd101wyy/Edge-Detection/master/index.html).

## Install & Usage
```sh
npm install -g http-server
cd {project_folder}
http-server
```
You can also open `index.html` in browser directly, but it might cause `crossOrigin` error.

## References
* [sobel](https://thiscouldbebetter.wordpress.com/2013/08/14/filtering-images-with-convolution-masks-in-javascript/)
* [nice lecture note](http://graphics.cs.cmu.edu/courses/15-463/2005_fall/www/Lectures/convolution.pdf)
* [nice materials](https://www.html5rocks.com/en/tutorials/canvas/imagefilters/)
* [convolution](http://www.phpied.com/canvas-pixels-2-convolution-matrix/)
* [introduction of canny edge detection](https://medium.com/front-end-hacking/how-to-draw-in-javascript-c016787f1e4a#9ebe)
  * Gray Scale -> Gaussian Blur -> Canny Gradient ->Canny Non-maximum Suppression -> Canny Hysteresis -> Scanning
