const fs = require('fs')
const path = require('path')

exports.upload = (req, res) => {
  let fstream

  req.pipe(req.busboy)

  return Promise((resolve, reject) => {
  	req.busboy.on('file', (fieldname, file, filename) => {
  	  console.log('Uploading: ' + filename)

  	  fstream = fs.createWriteStream(path.join(__dirname, '../public/upload') + filename)

  	  file.pipe(fstream)

  	  fstream.on('close', () => {
  	    cb(null, fstream)

  	    resolve(fstream)
  	  })
  	})
  })
}