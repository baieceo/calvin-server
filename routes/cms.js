const db = require('../libs/db')
const _fs = require('fs')
const _path = require('path')
const express = require('express')
const lodash = require('lodash')
const crypto = require('crypto')
const moment = require('moment')
const walk = require('walk')
const utils = require('../utils')
const router = express.Router()
 
const getFileList = path => {
  const files = []
  const dirs = []
  const walker  = walk.walk(path, { followLinks: false });
 
  walker.on('file', (roots, stat, next) => {
      files.push(roots, stat.name)

      next()
  })
 
  walker.on('directory', (roots, stat, next) => {
      dirs.push(roots, stat.name)

      next()
  })

  return new Promise((resolve, reject) => {
    walker.on('end', function() {
      console.log(files)
      console.log(dirs)
      resolve(files, dirs)
    })

    walker.on('error', function() {
      reject()
    })
  })
}

const readDir = (path) => {
  return new Promise((resolve, reject) => {
    const results = []
    let count = 0

    _fs.readdir(path, (err, menu) => {
      if (err) {
        reject(false)

        return false
      }

      if (!menu.length) {
        resolve([])

        return false
      }

      menu.forEach((item, index) => { 
        _fs.stat(path + '/' + item, (err, info) => {
          count++

          if (info.isDirectory()) {
            results.push({
              type: 'directory',
              path: path + '/' + item,
              name: item
            })
          } else {
            results.push({
              type: 'file',
              path: path + '/' + item,
              name: item
            })
          }

          if (count === menu.length) {
            resolve(results)
          }
        })
      })
    })
  })
}

/**
 * 读取路径信息
 * @param {string} path 路径
 */
const getStat = dir => {
  return new Promise((resolve, reject) => {
    _fs.stat(dir, (err, stats) => {
      if (err) {
        resolve(false)
      } else {
        resolve(stats)
      }
    })
  })
}

/**
 * 创建路径
 * @param {string} dir 路径
 */
const mkdir = dir => {
  return new Promise((resolve, reject) => {
    _fs.mkdir(dir, err => {
      if (err) {
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

/**
 * 创建文件
 * @param {string} path 路径
 */
const writeFile = (path, data, options) => {
  return new Promise((resolve, reject) => {
    _fs.writeFile(path, data, options, err => {
      if (err) {
        console.log(err)
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

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

/**
 * 删除目录及文件
 * @param {string} path 路径
 */
const rmdir = path => {
  let files = []

  if (_fs.existsSync(path)) {
    files = _fs.readdirSync(path)

    files.forEach((file, index) => {
      let curPath = path + '/' + file

      if (_fs.statSync(curPath).isDirectory()) {
        rmdir(curPath)
      } else {
        _fs.unlinkSync(curPath)
      }
    })
    
    _fs.rmdirSync(path)
  }
}

/* GET users listing. */
router.get('/', (req, res, next) => {
  res.send('respond with a resource')
})

// 检测目录是否存在
router.get('/type/path/exist', async (req, res, next) => {
  const { path } = req.query

  if (!path) {
    res.send({
      code: 10000,
      message: '参数缺失'
    })

    return false
  }

  const dir = _path.join(__dirname, `../public/cms/type/${path}`)

  const exist = await getStat(dir)

  res.send({
    code: 0,
    data: !!exist,
    message: 'success'
  })
})

// 获取分类
router.get('/type', async (req, res, next) => {
  const { id } = req.query

  let dir
  let data
  let results
  
  if (!id) {
    res.send({
      code: 10000,
      message: '参数缺失'
    })

    return false
  }

  dir = _path.join(__dirname, `../public/cms/type`)
  
  const listPath = dir + '/list.json'
  const exist = await getStat(listPath)

  if (!exist) {
    res.send({
      code: 10001,
      message: '请先创建分类'
    })

    return false
  }

  let { list } = JSON.parse(await readFile(listPath))
  let index = list.findIndex(i => i.id + '' === id + '')

  if (index === -1) {
    res.send({
      code: 10002,
      message: '分类不存在'
    })

    return false
  }

  data = list[index]

  if (data.create_account_id) {
    const create_account = await utils.getAccountById(data.create_account_id)

    data.create_account_name = create_account.account_id

    delete data.create_account_id
  }

  if (data.editor_account_id) {
    const editor_account =  await utils.getAccountById(data.editor_account_id)

    data.editor_account_name = editor_account.account_id

    delete data.editor_account_id
  }

  if (index === -1) {
    res.send({
      code: 10002,
      message: '目录不存在'
    })

    return false
  } else {
    res.send({
      code: 0,
      data: data,
      message: '获取分类成功'
    })
  }
})

// 创建分类
router.post('/type/create', async (req, res, next) => {
  const token = req.get('token')
  const { path, name, props } = req.body

  let dir
  let results
  
  if (!path || !name || !props || (props && !props.length)) {
    res.send({
      code: 10000,
      message: '参数缺失'
    })

    return false
  }

  dir = _path.join(__dirname, `../public/cms/type`)
  
  const exist = await getStat(dir + '/list.json')

  if (!exist) {
    await writeFile(dir + '/list.json', JSON.stringify({
      list: []
    }))
  }

  let { list } = JSON.parse(await readFile(dir + '/list.json'))

  if (list.find(p => p.path === path)) {
    res.send({
      code: 10001,
      message: '目录已存在'
    })

    return false
  }

  results = await mkdir(dir + '/' + path)

  if (!results) {
    res.send({
      code: 10001,
      message: '创建目录失败'
    })

    return false
  }

  const create_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
  const create_account = await utils.getAccountByToken(token)
  const create_account_id = create_account.id

  let id = 1

  if (list.length) {
    id = lodash.last(list.sort(list, ['id'], ['asc'])).id + 1
  }

  list.push({
    id, path, name, props, create_time, create_account_id 
  })

  results = await writeFile(dir + '/list.json', JSON.stringify({
    list
  }))

  if (results) {
    res.send({
      code: 0,
      data: id,
      message: '创建分类成功'
    })
  } else {
    res.send({
      code: 10001,
      message: '创建分类失败'
    })
  }
})


// 更新分类
router.post('/type/update', async (req, res, next) => {
  const token = req.get('token')
  const { id, path, name, props } = req.body

  let dir
  let data
  let results
  
  if (!id || !path || !name || !props || (props && !props.length)) {
    res.send({
      code: 10000,
      message: '参数缺失'
    })

    return false
  }

  dir = _path.join(__dirname, `../public/cms/type`)
  
  const listPath = dir + '/list.json'
  const exist = await getStat(listPath)

  if (!exist) {
    res.send({
      code: 10001,
      message: '请先创建分类'
    })
  }

  let { list } = JSON.parse(await readFile(listPath))
  let index = list.findIndex(i => i.id === id)

  if (index === -1) {
    res.send({
      code: 10002,
      message: '目录不存在'
    })

    return false
  }

  let target = list[index]

  const editor_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
  const editor_account = await utils.getAccountByToken(token)
  const editor_account_id = editor_account.id

  const create_time = target.create_time
  const create_account_id = target.create_account_id

  data = {
    id, path, name, props, create_time, create_account_id, editor_time, editor_account_id
  }

  list[index] = data

  results = await writeFile(listPath, JSON.stringify({ list }))

  if (results) {
    res.send({
      code: 0,
      data: `cms/${path}/type.json`,
      message: '更新分类成功'
    })
  } else {
    res.send({
      code: 10001,
      message: '更新分类失败'
    })
  }
})

// 删除分类
router.post('/type/remove', async (req, res, next) => {
  const token = req.get('token')
  const { id } = req.body

  let dir
  let data
  let results
  
  if (id === undefined) {
    res.send({
      code: 10000,
      message: '参数缺失'
    })

    return false
  }

  dir = _path.join(__dirname, `../public/cms/type`)
  
  const listPath = dir + '/list.json'
  const exist = await getStat(listPath)

  if (!exist) {
    res.send({
      code: 10001,
      message: '请先创建分类'
    })
  }

  let { list } = JSON.parse(await readFile(listPath))
  let index = list.findIndex(p => p.id === id)
  let target = list[index]

  if (index === -1) {
    res.send({
      code: 10002,
      message: '目录不存在'
    })

    return false
  }

  // 删除目录
  rmdir(_path.join(dir, '/' + target.path))

  list.splice(index, 1)

  results = await writeFile(listPath, JSON.stringify({ list }))

  if (results) {
    res.send({
      code: 0,
      data: `cms/${target.path}`,
      message: '删除分类成功'
    })
  } else {
    res.send({
      code: 10001,
      message: '删除分类失败'
    })
  }
})

// 分类列表
router.get('/type/list', async (req, res, next) => {
  const { id, path, name, pageNum = 1, pageSize = 10 } = req.query
  
  let dir
  let data
  let results

  dir = _path.join(__dirname, `../public/cms/type`)
  
  const listPath = dir + '/list.json'
  const exist = await getStat(listPath)

  if (!exist) {
    await writeFile(dir + '/list.json', JSON.stringify({
      list: []
    }))
  }

  let { list } = JSON.parse(await readFile(listPath))

  // 筛选
  if (id) {
    list = list.filter(i => i.id + '' === id + '')
  }

  if (path) {
    list = list.filter(i => i.path.indexOf(path) !== -1)
  }

  if (name) {
    list = list.filter(i => i.name.indexOf(name) !== -1)
  }

  const pagination = {
    page: pageNum,
    size: pageSize,
    total: list.length
  }

  const start = (pageNum - 1) * pageSize
  const end = start + pageSize

  list = list.slice(start, end)

  res.send({
    code: 0,
    data: {
      list,
      pagination
    },
    message: '获取分类列表成功'
  })
})







// 获取页面
router.get('/page', async (req, res, next) => {
  const { id } = req.query

  let dir
  let data
  let results
  
  if (!id) {
    res.send({
      code: 10000,
      message: '参数缺失'
    })

    return false
  }
  
  // 没有页面索引则创建
  dir = _path.join(__dirname, `../public/cms/type`)

  const pageListPath = _path.join(dir, 'page.json')
  const exist = await getStat(pageListPath)

  if (!exist) {
    results = await writeFile(pageListPath, JSON.stringify({
      list: []
    }))
  }


  // 页面索引数据
  const pageListResult = JSON.parse(await readFile(pageListPath))

  let pageListData = pageListResult.list

  let targetIndex = pageListData.findIndex(i => i.id === id)
  let targetPage = pageListData[targetIndex]

  if (targetIndex === -1) {
    res.send({
      code: 10002,
      message: '页面不存在'
    })

    return false
  }

  let listData = JSON.parse(await readFile(_path.join(dir, 'list.json')))

  let targetPath = listData.list.find(i => i.id === targetPage.type).path

  let pagePath = _path.join(dir, targetPath, targetPage.id + '.json')

  let pageData = JSON.parse(await readFile(pagePath))

  if (pageData.create_account_id) {
    const create_account = await utils.getAccountById(pageData.create_account_id)

    pageData.create_account_name = create_account.account_id
  }

  if (pageData.editor_account_id) {
    const editor_account = await utils.getAccountById(pageData.editor_account_id)

    pageData.editor_account_name = editor_account.account_id
  }

  pageData.url = global.baseurl + '/cms/type/' + targetPath + '/' + targetPage.id + '.json'

  if (pageData) {
    res.send({
      code: 0,
      data: pageData,
      message: 'success'
    })

    return false
  } else {
    res.send({
      code: 10002,
      message: '获取页面失败'
    })

    return false
  }
})

// 创建页面
router.post('/page/create', async (req, res, next) => {
  const token = req.get('token')
  const { type, title, props } = req.body
  
  let dir
  let data
  let results
  
  if (!type || !title || !props) {
    res.send({
      code: 10000,
      message: '参数缺失'
    })

    return false
  }

  dir = _path.join(__dirname, `../public/cms/type`)

  const listPath = dir + '/list.json'
  
  let { list } = JSON.parse(await readFile(listPath))
  let targetType = list.find(i => i.id === type)

  if (!targetType) {
    res.send({
      code: 10010,
      message: '分类不存在'
    })

    return false
  }
  
  const pageListPath = _path.join(dir, 'page.json')
  const exist = await getStat(pageListPath)

  if (!exist) {
    results = await writeFile(pageListPath, JSON.stringify({
      list: []
    }))
  }

  // 页面列表数据
  const pageListResult = JSON.parse(await readFile(pageListPath))

  let pageListData = pageListResult.list

  const timestamp = +new Date()
  const targetPath = _path.join(dir, targetType.path)
  const id = type + '00000' + timestamp
  const fileName = id + '.json'
  const filePath = _path.join(targetPath, fileName)

  const create_time = moment(new Date(timestamp)).format('YYYY-MM-DD HH:mm:ss')
  const create_account = await utils.getAccountByToken(token)
  const create_account_id = create_account.id

  data = {
    id,
    type,
    title,
    props,
    create_time,
    create_account_id
  }

  results = await writeFile(filePath, JSON.stringify(data))

  delete data.props
  
  pageListData.push(data)

  results = await writeFile(pageListPath, JSON.stringify({
    list: pageListData
  }))

  if (results) {
    res.send({
      code: 0,
      data: id,
      message: '创建页面成功'
    })
  } else {
    res.send({
      code: 10001,
      message: '创建页面失败'
    })
  }
})

// 更新页面
router.post('/page/update', async (req, res, next) => {
  const token = req.get('token')
  const { id, type, title, props } = req.body

  let dir
  let data
  let results
  
  if (!id || !type || !title || !props) {
    res.send({
      code: 10000,
      message: '参数缺失'
    })

    return false
  }
  
  // 没有页面索引则创建
  dir = _path.join(__dirname, `../public/cms/type`)

  const pageListPath = _path.join(dir, 'page.json')
  const exist = await getStat(pageListPath)

  if (!exist) {
    results = await writeFile(pageListPath, JSON.stringify({
      list: []
    }))
  }


  // 页面索引数据
  const pageListResult = JSON.parse(await readFile(pageListPath))

  let pageListData = pageListResult.list

  let targetIndex = pageListData.findIndex(i => i.id === id)
  let targetPage = pageListData[targetIndex]

  if (targetIndex === -1) {
    res.send({
      code: 10002,
      message: '页面不存在'
    })

    return false
  }

  let listData = JSON.parse(await readFile(_path.join(dir, 'list.json')))

  let targetPath = listData.list.find(i => i.id === targetPage.type).path

  let pagePath = _path.join(dir, targetPath, targetPage.id + '.json')
  let pageData = JSON.parse(await readFile(pagePath))

  const create_time = pageData.create_time
  const create_account_id = pageData.create_account_id
  
  const editor_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
  const editor_account = await utils.getAccountByToken(token)
  const editor_account_id = editor_account.id

  data = {
    id,
    type,
    title,
    props,
    create_time,
    create_account_id,
    editor_time,
    editor_account_id
  }

  pageListData[targetIndex].title = title

  results = await writeFile(pageListPath, JSON.stringify({
    list: pageListData
  }))

  results = await writeFile(pagePath, JSON.stringify(data))

  if (results) {
    res.send({
      code: 0,
      data: id,
      message: 'success'
    })
  } else {
    res.send({
      code: 10002,
      message: '更新页面失败'
    })
  }
})

// 删除页面
router.post('/page/remove', async (req, res, next) => {
  const token = req.get('token')
  const { id } = req.body

  let dir
  let data
  let results
  
  if (!id) {
    res.send({
      code: 10000,
      message: '参数缺失'
    })

    return false
  }
  
  // 没有页面索引则创建
  dir = _path.join(__dirname, `../public/cms/type`)

  const pageListPath = _path.join(dir, 'page.json')
  const pageListData = JSON.parse(await readFile(pageListPath)).list
  const pageListIndex = pageListData.findIndex(i => i.id === id)
  
  if (pageListIndex === -1) {
    res.send({
      code: 10002,
      message: '无此页面'
    })

    return false
  }

  const pageTypeId = pageListData[pageListIndex].type
  const typeListPath = _path.join(dir, 'list.json')
  const typeListData = JSON.parse(await readFile(typeListPath)).list
  const typeListIndex = typeListData.findIndex(i => i.id === pageTypeId)

  if (typeListIndex === -1) {
    res.send({
      code: 10002,
      message: '无此分类'
    })

    return false
  }

  const typePath = typeListData[typeListIndex].path

  const pagePath = _path.join(dir, typePath, id + '.json')

  _fs.unlinkSync(pagePath)

  pageListData.splice(pageListIndex)

  results = await writeFile(pageListPath, JSON.stringify({
    list: pageListData
  }))


  if (results) {
    res.send({
      code: 0,
      message: 'success'
    })
  } else {
    res.send({
      code: 10002,
      message: '删除页面失败'
    })
  }
})

// 页面列表
router.get('/page/list', async (req, res, next) => {
  const { id, title, type, pageNum = 1, pageSize = 10 } = req.query
  
  let dir
  let data
  let results

  dir = _path.join(__dirname, `../public/cms/type`)
  
  const pageListPath = dir + '/page.json'
  const exist = await getStat(pageListPath)

  if (!exist) {
    await writeFile(dir + '/page.json', JSON.stringify({
      list: []
    }))
  }

  let { list } = JSON.parse(await readFile(pageListPath))

  // 筛选
  if (id) {
    list = list.filter(i => i.id + '' === id + '')
  }

  if (title) {
    list = list.filter(i => i.title.indexOf(title) !== -1)
  }

  if (type) {
    list = list.filter(i => i.type + '' === type)
  }

  const typeListPath = _path.join(dir, 'list.json')
  const typeListData = JSON.parse(await readFile(typeListPath)).list

  list = list.map(i => {
    i.typeName = typeListData.find(n => n.id === i.type).name

    return i
  })

  const pagination = {
    page: pageNum,
    size: pageSize,
    total: list.length
  }

  const start = (pageNum - 1) * pageSize
  const end = start + pageSize

  list = list.slice(start, end)

  res.send({
    code: 0,
    data: {
      list,
      pagination
    },
    message: '获取页面列表成功'
  })
})


// 资源列表
router.get('/resource/list', async (req, res, next) => {
  const { name, path, pageNum = 1, pageSize = 10 } = req.query

  const paths = []

  paths.push(__dirname)
  paths.push('../public')

  if (path) {
    paths.push(decodeURIComponent(path))
  }
  
  let results = await readDir(_path.join(...paths))

  results = results.map(i => {
    i.path = _path.normalize(i.path.replace(_path.join(__dirname, '../'), '')).replace(/[\/\\]+/g, '/').replace(/^public/, '')

    if (i.type === 'file') {
      i.url = global.baseurl + i.path

      i.extname = _path.extname(i.name)
    }

    return i
  })

  if (results) {
    res.send({
      code: 0,
      data: results,
      message: '获取资源列表成功'
    })
  } else {
    res.send({
      code: 10001,
      data: results,
      message: '获取资源列表失败'
    })
  }
})

// 文件夹是否存在
router.get('/resource/folder/exist', async (req, res, next) => {
  const { path, name } = req.query

  if (!path || !name) {
    res.send({
      code: 10001,
      message: '参数缺失'
    })

    return false
  }

  const dir = _path.join(__dirname, '../public', path, name)
  const stat = await getStat(dir)

  res.send({
    code: 0,
    data: !!stat,
    message: 'success'
  })
})

// 文件夹创建
router.post('/resource/folder/create', async (req, res, next) => {
  const { path, name } = req.body

  if (!path || !name) {
    res.send({
      code: 10001,
      message: '参数缺失'
    })

    return false
  }

  const dir = _path.join(__dirname, '../public', path, name)
  const stat = await getStat(dir)

  if (stat) {
    res.send({
      code: 10002,
      message: '文件夹已存在'
    })

    return false
  }

  const results = await mkdir(dir)

  if (results) {
    res.send({
      code: 0,
      message: 'success'
    })
  } else {
    res.send({
      code: 10003,
      message: '文件夹创建失败'
    })
  }
})

// 资源删除
router.post('/resource/remove', async (req, res, next) => {
  const { path, name } = req.body

  if (!path || !name) {
    res.send({
      code: 10001,
      message: '参数缺失'
    })

    return false
  }

  const dir = _path.join(__dirname, '../public', path, name)
  const stat = await getStat(dir)

  if (!stat) {
    res.send({
      code: 10002,
      message: '不存在'
    })

    return false
  }

  if (_fs.statSync(dir).isDirectory()) {
    rmdir(dir)
  } else {
    _fs.unlinkSync(dir)
  }

  res.send({
    code: 0,
    message: '删除成功'
  })
})


// 资源重命名
router.post('/resource/rename', async (req, res, next) => {
  const { path, name, oldName } = req.body

  if (!path || !name || !oldName) {
    res.send({
      code: 10001,
      message: '参数缺失'
    })

    return false
  }

  const dir = _path.join(__dirname, '../public', path)
  const sourcePath = _path.join(dir, oldName)
  const targetPath = _path.join(dir, name)

  const stat = await getStat(sourcePath)

  if (!stat) {
    res.send({
      code: 10002,
      message: '不存在'
    })

    return false
  }

  _fs.rename(sourcePath, targetPath, err => { 
    if (err) { 
      res.send({
        code: 10001,
        message: '重命名失败'
      })
    } else { 
      res.send({
        code: 0,
        message: '重命名成功'
      })
    }
  })
})

module.exports = router
