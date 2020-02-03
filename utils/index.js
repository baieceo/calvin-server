const db = require('../libs/db')

const utils = {}

utils.getAccountByToken = async (token) => {
	let sqlSyntax = ``

	sqlSyntax = `
	  SELECT id, account_id, account_role, account_perms
	  FROM calvin.account_tbl
	  WHERE token = ?
	`

	const results = await db.exec(sqlSyntax, [token])
	

	if (results && results.length) {
		const perms = results[0].account_perms.split(',').map(p => `id = ${p}`)

		sqlSyntax = `
			SELECT perm_key
			FROM calvin.perm_tbl
			WHERE ${perms.join(' OR ')}
		`

		const permsName = await db.exec(sqlSyntax)
		
		return Promise.resolve({
			...results[0],
			account_perms_name: permsName.map(p => p.perm_key)
		})
	} else {
		return Promise.reject(false)
	}
}

utils.getAccountById = async (id) => {
	let sqlSyntax = ``

	sqlSyntax = `
	  SELECT id, account_id, account_role, account_perms
	  FROM calvin.account_tbl
	  WHERE id = ?
	`

	const results = await db.exec(sqlSyntax, [id])
	

	if (results && results.length) {
		const perms = results[0].account_perms.split(',').map(p => `id = ${p}`)

		sqlSyntax = `
			SELECT perm_key
			FROM calvin.perm_tbl
			WHERE ${perms.join(' OR ')}
		`

		const permsName = await db.exec(sqlSyntax)
		
		return Promise.resolve({
			...results[0],
			account_perms_name: permsName.map(p => p.perm_key)
		})
	} else {
		return Promise.reject(false)
	}
}

module.exports = utils