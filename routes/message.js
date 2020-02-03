const db = require('../libs/db')
const utils = require('../utils')
const express = require('express')
const lodash = require('lodash')
const crypto = require('crypto')
const moment = require('moment')
const router = express.Router()

const cryptPwd = (password) => {
	const md5 = crypto.createHash('md5')

	return md5.update(password).digest('hex')
}

/* GET users listing. */
router.get('/', (req, res, next) => {
  res.send('respond with a resource')
})

// 查询留言信息
router.get('/info', async (req, res, next) => {
  const { id } = req.query

  let sqlSyntax = ``

  sqlSyntax = `
    SELECT id, name, email, mobile, wechat, grade, content, remarks, create_time, editor_time, editor_id, status
    FROM calvin.message_tbl
    WHERE id = ?
  `

  const apply = await db.exec(sqlSyntax, [ Number(id) ])

  if (!apply.length) {
    res.send({
      code: 10005,
      message: '无此消息'
    })

    return false
  }

  sqlSyntax = `
    SELECT account_id
    FROM calvin.account_tbl
    WHERE id = ?
  `

  const account = await db.exec(sqlSyntax, [ apply[0].editor_id ])

  if (account && account.length) {
    apply[0].editor_name = account[0].account_id
  } else {
    apply[0].editor_name = null
  }

  res.send({
    code: 0,
    data: apply[0],
    message: 'success'
  })
})


// 创建留言
router.post('/create', async (req, res, next) => {
  let sqlSyntax = ``
  let results
  const { name, email, mobile, wechat, grade, content } = req.body

  if (!name || !email || !mobile || !wechat || !grade || !content) {
  	res.send({
      code: 10000,
      message: '参数缺失'
    })

    return false
  }

  sqlSyntax = `
    SELECT name, email, mobile, wechat, grade, content
    FROM calvin.message_tbl
    WHERE  name = ? AND email = ? AND mobile = ? AND wechat = ? AND grade = ? AND  content = ?
  `

  results = await db.exec(sqlSyntax, [ name, email, mobile, wechat, grade, content ])

  if (results.length) {
    res.send({
      code: 10005,
      message: '留言重复'
    })

    return false
  }

  sqlSyntax = `
  	INSERT INTO calvin.message_tbl (name, email, mobile, wechat, grade, content, create_time)
  	VALUES (?, ?, ?, ?, ?, ?, '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}')
  `

  results = await db.exec(sqlSyntax, [ name, email, mobile, wechat, grade, content ])

  if (results.affectedRows) {
  	res.send({
  		code: 0,
  		message: 'success'
  	})
  } else {
    res.send({
      code: 10003,
      message: '创建权限失败'
    })
  }
})

// 更新留言
router.post('/update', async (req, res, next) => {
  const { id, status, remarks } = req.body
  const token = req.get('token')
  const sqlQueue = []
  let sqlSyntax = ``
  let results
  let editorId

  if (id === undefined || status === undefined || remarks === undefined) {
    res.send({
      code: 10008,
      message: '参数缺失'
    })

    return false
  }

  results = await utils.getAccountByToken(token)

  if (results) {
    editorId = results.id
  } else {
    res.send({
      code: 10009,
      message: '无权限'
    })

    return false
  }

  sqlSyntax = `
    UPDATE calvin.message_tbl 
    SET status = ?, remarks = ?, editor_id = ?, editor_time = ?
    WHERE id = ?
  `

  results = await db.exec(sqlSyntax, [status, remarks, editorId, moment(new Date()).format('YYYY-MM-DD HH:mm:ss'), id])

  if (results.affectedRows) {
    res.send({
      code: 0,
      message: 'success'
    })
  } else {
    res.send({
      code: 10010,
      message: '更新失败'
    })
  }
})

// 删除留言
router.post('/remove', async (req, res, next) => {
  const { id } = req.body
  const sqlQueue = []
  let sqlSyntax = ``

  if (!id) {
    res.send({
      code: 10008,
      message: '参数缺失'
    })

    return false
  }

  sqlSyntax = `
    SELECT id
    FROM calvin.message_tbl
    WHERE id = '${id}'
  `

  let results = await db.exec(sqlSyntax)

  if (!results.length) {
    res.send({
      code: 10009,
      message: '无此记录'
    })

    return false
  }
  
  // 删除权限表中对应权限
  sqlSyntax = `
    DELETE FROM calvin.message_tbl
    WHERE id = ${id}
  `

  results = await db.exec(sqlSyntax)

  if (results.affectedRows) {
    res.send({
      code: 0,
      message: 'success'
    })
  } else {
    res.send({
      code: 10011,
      message: '删除失败'
    })
  }
})

// 查询列表
router.get('/list', async (req, res, next) => {
  const { name, email, mobile, wechat, grade, content, status, create_timerange, pageNum = 1, pageSize = 10 } = req.query
  const sqlQueue = []
  let sqlSyntax = ``

  sqlSyntax = `
    SELECT SQL_CALC_FOUND_ROWS id, name, email, mobile, wechat, grade, content, status, create_time, editor_time, editor_id
    FROM calvin.message_tbl
  `

  let condition = []
  let params = []

  if (Number(pageNum) + '' !== pageNum + '' || Number(pageSize) + '' !== pageSize + '') {
    res.send({
      code: 100010,
      message: '参数不合法'
    })

    return false
  }

  if (name) {
    condition.push(`name LIKE ?`)

    params.push(`%${name}%`)
  }

  if (email) {
    condition.push(`email LIKE ?`)

    params.push(`%${email}%`)
  }

  if (mobile) {
    condition.push(`mobile LIKE ?`)

    params.push(`%${mobile}%`)
  }

  if (grade) {
    condition.push(`grade LIKE ?`)

    params.push(`%${grade}%`)
  }

  if (content) {
    condition.push(`content LIKE ?`)

    params.push(`%${content}%`)
  }

  if (status) {
    condition.push(`status = ?`)

    params.push(status)
  }

  if (create_timerange) {
    condition.push(`create_time BETWEEN ? AND ?`)

    params.push(create_timerange[0], create_timerange[1])
  }

  if (condition.length) {
    params = lodash.flattenDeep(params)

  	sqlSyntax += ` WHERE ${condition.join(' AND ')}`
  }

  sqlSyntax += ` ORDER BY id DESC LIMIT ?, ?`

  params.push((Number(pageNum) - 1) * Number(pageSize))
  params.push(Number(pageSize))

  const results = await db.exec(sqlSyntax, params)
  const total = (await db.exec(`SELECT FOUND_ROWS()`))[0]['FOUND_ROWS()']  // 查询记录数
  
  res.send({
    code: 0,
    data: {
    	list: results,
      pagination: {
        page: Number(pageNum),
        size: Number(pageSize),
        total
      }
    },
    message: 'success'
  })
})


module.exports = router
