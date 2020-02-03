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

// 查询用户信息
router.get('/info', async (req, res, next) => {
  const token = req.get('token')

  let sqlSyntax = ``

  sqlSyntax = `
    SELECT t1.account_id, t1.account_role, t1.account_avatar, t1.account_perms, t2.id, t2.role_name
    FROM calvin.account_tbl t1
    INNER JOIN calvin.role_tbl t2
    ON t1.token = '${token}'
    AND t1.account_role = t2.id
  `

  const results = await db.exec(sqlSyntax)

  if (results && results.length) {
    const accountPerms = results[0].account_perms.split(',').map(p => Number(p))

    sqlSyntax = `
      SELECT id, perm_key, perm_name
      FROM calvin.perm_tbl
    `

    const perm_tbl = await db.exec(sqlSyntax)

    const perms = perm_tbl.filter(p => accountPerms.includes(p.id))

  	res.send({
  	  code: 0,
  	  data: {
  	  	avatar: results[0].account_avatar,
        name: results[0].account_id,
        role_id: results[0].account_role,
        role_name: results[0].role_name,
        role_perms: perms
  	  },
  	  message: 'success'
  	})

  	return false
  }
  
  res.send({
    code: 10005,
    message: '未查询到用户信息'
  })
})


// 登录
router.post('/login', async (req, res, next) => {
  const { accountId, accountPwd } = req.body
  let sqlSyntax = ``
  
  if (!accountId) {
  	res.send({
  		code: 10000,
  		message: '账户ID不能为空'
  	})

  	return false
  }

  if (!accountPwd) {
  	res.send({
  		code: 10001,
  		message: '账户密码不能为空'
  	})

  	return false
  }

  sqlSyntax = `
    SELECT account_id
    FROM calvin.account_tbl
    WHERE account_id = '${accountId}'
  `

  let exist = await db.exec(sqlSyntax)

  if (!exist.length) {
  	res.send({
  		code: 10003,
  		message: '账户不存在'
  	})

  	return false
  }

  sqlSyntax = `
    SELECT account_id
    FROM calvin.account_tbl
    WHERE account_id = '${accountId}'
    AND account_pwd = '${cryptPwd(accountPwd)}'
  `

  exist = await db.exec(sqlSyntax)

  if (!exist.length) {
  	res.send({
  		code: 10003,
  		message: '账户密码错误'
  	})

  	return false
  }
  
  const loginTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
  const token = cryptPwd(accountId + accountPwd + loginTime + Math.random())

  sqlSyntax = `
    UPDATE calvin.account_tbl 
    SET token = '${token}', login_time = '${loginTime}'
    WHERE account_id = '${accountId}'
  `

  const results = await db.exec(sqlSyntax)

  res.send({
  	code: 0,
  	data: {
  		token
  	},
  	message: 'success'
  })
})

// 创建账户
router.post('/create', async (req, res, next) => {
  let sqlSyntax = ``
  const { accountId, accountPwd, accountAvatar, accountRoleId, accountPerms } = req.body

  if (!accountId || !accountPwd || !accountAvatar || !accountRoleId || !accountPerms) {
  	res.send({
  		code: 10000,
  		message: '参数缺失'
  	})

  	return false
  }

  sqlSyntax = `
    SELECT account_id
    FROM calvin.account_tbl
    WHERE account_id = '${accountId}'
  `

  let exist = await db.exec(sqlSyntax)

  if (exist.length) {
  	res.send({
  		code: 10002,
  		message: '账户ID已存在'
  	})

  	return false
  }

  sqlSyntax = `
  	INSERT INTO calvin.account_tbl (account_id, account_pwd, account_avatar, account_role, account_perms, create_time)
  	VALUES ('${accountId}', '${cryptPwd(accountPwd)}', '${accountAvatar}', ${accountRoleId}, '${accountPerms}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}')
  `

  let results = await db.exec(sqlSyntax)

  if (results.affectedRows) {
  	res.send({
  		code: 0,
  		message: 'success'
  	})
  }
})

// 删除账户
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
    FROM calvin.account_tbl
    WHERE id = '${id}'
  `

  let results = await db.exec(sqlSyntax)

  if (!results.length) {
    res.send({
      code: 10009,
      message: '无此用户'
    })

    return false
  }

  sqlSyntax = `
    DELETE FROM calvin.account_tbl
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

// 更新账户
router.post('/update', async (req, res, next) => {
  const { id, accountId, accountPwd, accountAvatar, accountRoleId, accountPerms } = req.body
    const sqlQueue = []
    let sqlSyntax = ``

    if (!id || !accountId || !accountAvatar || !accountRoleId || !accountPerms) {
      res.send({
        code: 10008,
        message: '参数缺失'
      })

      return false
    }

    sqlSyntax = `
      SELECT id
      FROM calvin.account_tbl
      WHERE id = '${id}'
    `

    let results = await db.exec(sqlSyntax)

    if (!results.length) {
      res.send({
        code: 10009,
        message: '用户不存在'
      })

      return false
    }

    sqlSyntax = `
      UPDATE calvin.account_tbl 
      SET account_id = '${accountId}', account_avatar = '${accountAvatar}', account_role = '${accountRoleId}', account_perms = '${accountPerms}'
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
        code: 10010,
        message: '更新失败'
      })
    }
})

router.post('/password', async (req, res, next) => {
  const { id, accountPwd, accountPwdOld } = req.body
    const sqlQueue = []
    let sqlSyntax = ``

    if (!id || !accountPwd || !accountPwdOld) {
      res.send({
        code: 10008,
        message: '参数缺失'
      })

      return false
    }

    sqlSyntax = `
      SELECT id
      FROM calvin.account_tbl
      WHERE id = '${id}'
    `

    let results = await db.exec(sqlSyntax)

    if (!results.length) {
      res.send({
        code: 10009,
        message: '用户不存在'
      })

      return false
    }

    sqlSyntax = `
      SELECT account_pwd
      FROM calvin.account_tbl
      WHERE id = '${id}'
    `
    
    results = await db.exec(sqlSyntax)

    if (results[0].account_pwd !== cryptPwd(accountPwdOld)) {
      res.send({
        code: 10011,
        message: '原密码不正确'
      })

      return false
    }


    sqlSyntax = `
      UPDATE calvin.account_tbl 
      SET account_pwd = '${cryptPwd(accountPwd)}'
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
        code: 10010,
        message: '更新失败'
      })
    }
})

// 查询列表
router.get('/list', async (req, res, next) => {
  const { account_id, account_role, pageNum = 1, pageSize = 10 } = req.query
  const sqlQueue = []
  let sqlSyntax = ``
  const condition = []

  // SELECT a.runoob_id, b.runoob_count FROM runoob_tbl a INNER JOIN tcount_tbl b ON a.runoob_author = b.runoob_author;

  sqlSyntax = `
    SELECT SQL_CALC_FOUND_ROWS t1.id, t1.account_id, t1.account_avatar, t1.account_role, t1.account_perms, t1.create_time, t2.role_name
    FROM calvin.account_tbl t1
    INNER JOIN calvin.role_tbl t2
    ON t1.account_role = t2.id
  `

  if (account_id) {
    condition.push(`account_id = '${account_id}'`)
  }

  if (account_role) {
    condition.push(`account_role = ${account_role}`)
  }

  if (condition.length) {
    sqlSyntax += ` WHERE ${condition.join(' AND ')}`
  }

  sqlSyntax += ` ORDER BY t1.id DESC LIMIT ${(Number(pageNum) - 1) * Number(pageSize)}, ${Number(pageSize)}`


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
