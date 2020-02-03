const db = require('../libs/db')
const _fs = require('fs')
const _path = require('path')
const multer  = require('multer')
const express = require('express')
const router = express.Router()

const upload = multer({ dest: _path.join(__dirname, '../public') })

router.post('/', upload.single('file'), (req, res, next) => {
  const { path, name } = req.body

  const temp_path = req.file.path
  const ext = '.' + req.file.originalname.split('.')[1]

  let targetPath = _path.join(__dirname, '../public')
  let targetName = req.file.path + ext

  if (path) {
    targetPath = _path.join(targetPath, '/', path)
  } else {
    targetPath = _path.join(targetPath, '/uploads')
  }

  if (name) {
    targetName = _path.basename(name.split('.')[0] + ext)
  } else {
    targetName = _path.basename(req.file.path + ext)
  }

  targetPath = _path.join(targetPath, targetName)

  let urlPath = _path.normalize(targetPath.replace(_path.join(__dirname, '../', '/public'), ''))

  urlPath = urlPath.replace(/[\/\\]+/g, '/')

  urlPath = global.baseurl + urlPath

  _fs.rename(temp_path, targetPath, (err, data) => {
    if (err) {
      res.send({
        code: 10006,
        message: '上传文件失败'
      })

      return false
    }

    res.send({
      code: 0,
      data: urlPath,
      message: 'success'
    })
  });
})

module.exports = router
