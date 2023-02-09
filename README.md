# mediascroller
image and video scroller for website things using nodejs and expressjs
just a nice and simple scroller for media and image content on a computer to show on a website.

includes
1. javascript lazy loading
2. dynamic loading, so only loads 20 media at a time until you scroll to bottom


```
npm install
node node.js
```

update file locations to point to on node.js `config.dir` variable and `database_file`
also update in public `scroller.js` the static file locations of the image location. 
for this example in public will be folder called `memes` which will hold all images and `config.dir` will scan that file.
