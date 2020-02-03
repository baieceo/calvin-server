const db = require('../libs/db')
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

// 创建权限
router.post('/create', async (req, res, next) => {
  let sqlSyntax = ``
  const { permKey, permName } = req.body

  if (!permKey || !permName) {
  	res.send({
      code: 10000,
      message: '参数缺失'
    })

    return false
  }

  sqlSyntax = `
    SELECT perm_key
    FROM calvin.perm_tbl
    WHERE perm_key = '${permKey}'
  `

  let exist = await db.exec(sqlSyntax)

  if (exist.length) {
  	res.send({
  		code: 10002,
  		message: '权限KEY已存在'
  	})

  	return false
  }

  sqlSyntax = `
  	INSERT INTO calvin.perm_tbl (perm_key, perm_name, create_time)
  	VALUES ('${permKey}', '${permName}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}')
  `

  let results = await db.exec(sqlSyntax)

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

// 更新权限
router.post('/update', async (req, res, next) => {
  const { permId, permKey, permName } = req.body
  const sqlQueue = []
  let sqlSyntax = ``

  if (!permId || !permKey || !permName) {
    res.send({
      code: 10008,
      message: '参数缺失'
    })

    return false
  }

  sqlSyntax = `
    SELECT id
    FROM calvin.perm_tbl
    WHERE id = '${permId}'
  `

  let results = await db.exec(sqlSyntax)

  if (!results.length) {
    res.send({
      code: 10009,
      message: '无权限'
    })

    return false
  }

  sqlSyntax = `
    UPDATE calvin.perm_tbl 
    SET perm_key = '${permKey}', perm_name = '${permName}'
    WHERE id = ${permId}
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

// 删除权限
router.post('/remove', async (req, res, next) => {
  const { permId } = req.body
  const sqlQueue = []
  let sqlSyntax = ``

  if (!permId) {
    res.send({
      code: 10008,
      message: '参数缺失'
    })

    return false
  }

  sqlSyntax = `
    SELECT id
    FROM calvin.perm_tbl
    WHERE id = '${permId}'
  `

  let results = await db.exec(sqlSyntax)

  if (!results.length) {
    res.send({
      code: 10009,
      message: '无权限'
    })

    return false
  }
  
  // 删除权限表中对应权限
  sqlSyntax = `
    DELETE FROM calvin.perm_tbl
    WHERE id = ${permId}
  `

  sqlQueue.push(db.exec(sqlSyntax))

  // 删除角色表中对应权限
  sqlSyntax = `
    SELECT id, role_perms
    FROM calvin.role_tbl
  `

  results = await db.exec(sqlSyntax)

  results.forEach(row => {
    const perms = row.role_perms.split(',')
    const index = perms.findIndex(p => p === permId + '')

    if (index !== -1) {
      perms.splice(index, 1)

      sqlSyntax = `
        UPDATE calvin.role_tbl 
        SET role_perms = '${perms.join(',')}'
        WHERE id = ${row.id}
      `

      sqlQueue.push(db.exec(sqlSyntax))
    }
  })

  // 删除账户表中对应权限
  sqlSyntax = `
    SELECT id, account_perms
    FROM calvin.account_tbl
  `

  results = await db.exec(sqlSyntax)

  results.forEach(row => {
    const perms = row.account_perms.split(',')
    const index = perms.findIndex(p => p === permId + '')

    console.log(222222222, index, permId, perms)

    if (index !== -1) {
      perms.splice(index, 1)

      sqlSyntax = `
        UPDATE calvin.account_tbl 
        SET account_perms = '${perms.join(',')}'
        WHERE id = ${row.id}
      `

      sqlQueue.push(db.exec(sqlSyntax))
    }
  })

  Promise.all(sqlQueue).then(([...arg]) => {
    if (arg[0].affectedRows) {
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
  }).catch(_ => {
    console.log(_)

    res.send({
      code: 10011,
      message: '删除失败'
    })
  })

  /* if (results.affectedRows) {
    res.send({
      code: 0,
      message: 'success'
    })
  } else {
    res.send({
      code: 10011,
      message: '删除失败'
    })
  } */
})

// 查询列表
router.get('/list', async (req, res, next) => {
  const { permId, permKey, permName, pageNum = 1, pageSize = 10 } = req.query
  const sqlQueue = []
  let sqlSyntax = ``

  sqlSyntax = `
    SELECT SQL_CALC_FOUND_ROWS id, perm_key, perm_name, create_time
    FROM calvin.perm_tbl
  `

  const condition = []

  if (Number(pageNum) + '' !== pageNum + '' || Number(pageSize) + '' !== pageSize + '') {
    res.send({
      code: 100010,
      message: '参数不合法'
    })

    return false
  }

  if (permId) {
    condition.push(`id = '${permId}'`)
  }

  if (permKey) {
    condition.push(`perm_key LIKE '%${permKey}%'`)
  }

  if (permName) {
    condition.push(`perm_name LIKE '%${permName}%'`)
  }

  if (condition.length) {
  	sqlSyntax += ` WHERE ${condition.join(' AND ')}`
  }

  sqlSyntax += ` ORDER BY id DESC LIMIT ${(Number(pageNum) - 1) * Number(pageSize)}, ${Number(pageSize)}`

  const results = await db.exec(sqlSyntax)
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
