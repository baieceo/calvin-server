const _fs = require('fs')
const _path = require('path')
const express = require('express')
const router = express.Router()

/**
 * 读取文件
 * @param {string} path 路径
 */
const readFile = dir => {
  return new Promise((resolve, reject) => {
    _fs.readFile(dir, 'utf-8', (err, data) => {
      if (err) {
        resolve(false)
      } else {
        resolve(data)
      }
    })
  })
}

/* GET users listing. */
router.get('/', (req, res, next) => {
  res.send('respond with a resource')
})

// 获取枚举
router.get('/enums', async (req, res, next) => {
  const { key } = req.query

  if (!key) {
    res.send({
      code: 10000,
      message: '参数缺失'
    })

    return false
  }

  const dir = _path.join(__dirname, `../enums/${key}.js`)

  let file = await readFile(dir)

  if (!file) {
    res.send({
      code: 10001,
      message: '无此枚举'
    })

    return false
  }

  res.send({
    code: 0,
    data: eval(file),
    message: 'success'
  })
})

module.exports = router