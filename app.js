const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const busboy = require('connect-busboy')
const logger = require('morgan')

const db = require('./libs/db')

const indexRouter = require('./routes/index')
const commonRouter = require('./routes/common')
const cmsRouter = require('./routes/cms')
const roleRouter = require('./routes/role')
const permRouter = require('./routes/perm')
const uploadRouter = require('./routes/upload')
const accountRouter = require('./routes/account')
const applyRouter = require('./routes/apply')
const messageRouter = require('./routes/message')

const app = express()

// 初始化数据库
db.init()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.use(busboy())
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

global.token_cache = []
global.baseurl = 'http://localhost:3000'

app.all('*', (req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*')
	//Access-Control-Allow-Headers ,可根据浏览器的F12查看,把对应的粘贴在这里就行
	res.header('Access-Control-Allow-Headers', '*')
	res.header('Access-Control-Allow-Methods', '*')

	next()
})

app.use(async (req, res, next) => {
	const tokenExpires = 5 * 60 * 1000
	const whteList = ['/api/v1/account/login', '/api/v1/apply/create', '/api/v1/message/create', '/cms/type']

	if (!whteList.find(i => req.path.indexOf(i) === 0)) {
		const token = req.get('token')

		if (!token) {
			res.send({
				code: 400,
				message: 'token不能为空'
			})

			return false
		}

		const targetToken = global.token_cache.find(t => t.token === token)
		const targetTokenIndex = global.token_cache.findIndex(t => t.token === token)
		
		if (targetToken && targetTokenIndex !== -1) {
			if (+new Date() - targetToken.timestamp < tokenExpires) {
				global.token_cache[targetTokenIndex].timestamp = +new Date()

				next()

				return false
			} else {
				global.token_cache.splice(targetTokenIndex, 1)

				res.send({
					code: 401,
					message: 'token过期'
				})

				return false
			}
		}

		let sqlSyntax = `
			SELECT token
			FROM calvin.account_tbl
			WHERE token = '${token}'
		`

		const result = await db.exec(sqlSyntax)

		if (result && result[0] && result[0].token === token) {
			global.token_cache.push({
				token,
				timestamp: +new Date()
			})

			next()
		} else {
			res.send({
				code: 402,
				message: 'token无效'
			})
		}
	} else {
		next()
	}
})

app.use('/', indexRouter)
app.use('/api/v1/common', commonRouter)
app.use('/api/v1/cms', cmsRouter)
app.use('/api/v1/perm', permRouter)
app.use('/api/v1/role', roleRouter)
app.use('/api/v1/upload', uploadRouter)
app.use('/api/v1/account', accountRouter)
app.use('/api/v1/apply', applyRouter)
app.use('/api/v1/message', messageRouter)



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404))
})

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
