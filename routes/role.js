const db = require('../libs/db')
const express = require('express')
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

// 查询角色信息
router.get('/info', async (req, res, next) => {
  const { roleId } = req.query

  let sqlSyntax = ``

  sqlSyntax = `
    SELECT id, role_name, role_perms
    FROM calvin.role_tbl
    WHERE id = '${roleId}'
  `

  const results = await db.exec(sqlSyntax)

  if (results && results.length) {
  	res.send({
  	  code: 0,
  	  data: results[0],
  	  message: 'success'
  	})

  	return false
  }
  
  res.send({
    code: 10005,
    message: '无角色'
  })
})

// 创建角色
router.post('/create', async (req, res, next) => {
  let sqlSyntax = ``
  const { roleName, rolePerms } = req.body

  if (!roleName) {
  	res.send({
  		code: 10000,
  		message: '角色名称不能为空'
  	})

  	return false
  }

  if (!rolePerms) {
  	res.send({
  		code: 10001,
  		message: '角色权限不能为空'
  	})

  	return false
  }

  sqlSyntax = `
    SELECT role_name
    FROM calvin.role_tbl
    WHERE role_name = '${roleName}'
  `

  let exist = await db.exec(sqlSyntax)

  if (exist.length) {
  	res.send({
  		code: 10002,
  		message: '角色名称已存在'
  	})

  	return false
  }

  sqlSyntax = `
  	INSERT INTO calvin.role_tbl (role_name, role_perms, create_time)
  	VALUES ('${roleName}', '${rolePerms}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}')
  `

  let results = await db.exec(sqlSyntax)

  if (results.affectedRows) {
  	res.send({
  		code: 0,
  		message: 'success'
  	})
  }
})

// 更新账户
router.post('/update', async (req, res, next) => {
  const { roleId, roleName, rolePerms } = req.body
  const sqlQueue = []
  let sqlSyntax = ``

  if (!roleId || !roleName || !rolePerms) {
    res.send({
      code: 10008,
      message: '参数缺失'
    })

    return false
  }

  sqlSyntax = `
    SELECT id, role_name, role_perms
    FROM calvin.role_tbl
    WHERE id = '${roleId}'
  `

  let results = await db.exec(sqlSyntax)

  if (!results.length) {
    res.send({
      code: 10009,
      message: '为检索到相关角色'
    })

    return false
  }

  sqlSyntax = `
    UPDATE calvin.role_tbl 
    SET role_name = '${roleName}', role_perms = '${rolePerms}'
    WHERE id = ${roleId}
  `

  results = await db.exec(sqlSyntax)

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

// 删除角色
router.post('/remove', async (req, res, next) => {
  const { roleId } = req.body
  const sqlQueue = []
  let sqlSyntax = ``

  if (!roleId) {
    res.send({
      code: 10008,
      message: '参数缺失'
    })

    return false
  }

  sqlSyntax = `
    SELECT id, role_name, role_perms
    FROM calvin.role_tbl
    WHERE id = '${roleId}'
  `

  let results = await db.exec(sqlSyntax)

  if (!results.length) {
    res.send({
      code: 10009,
      message: '为检索到相关角色'
    })

    return false
  }

  sqlSyntax = `
    DELETE FROM calvin.role_tbl
    WHERE id = ${roleId}
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
  const { id } = req.query
  const sqlQueue = []
  let sqlSyntax = ``

  sqlSyntax = `
    SELECT id, role_name, role_perms, create_time
    FROM calvin.role_tbl
  `

  if (id) {
  	sqlSyntax += ` WHERE id = ${id}`
  }

  const results = await db.exec(sqlSyntax)
  
  res.send({
    code: 0,
    data: {
    	list: results
    },
    message: 'success'
  })
})


module.exports = router
