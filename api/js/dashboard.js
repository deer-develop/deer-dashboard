const mysql = require('mysql2/promise')
const { storage } = require('./config')

const pool = mysql.createPool(
	Object.assign(
		{
			multipleStatements: true,
			connectionLimit: 64,
		},
		storage,
	),
)

const selectSingular = async (queryString, args = []) => {
	const [rows] = await pool.query(queryString, args)
	return rows[0]
}

const selectPlural = async (queryString, args = []) => {
	const [rows] = await pool.query(queryString, args)
	return rows
}

const insert = async (queryString, args = []) => {
	const [obj] = await pool.query(queryString, args)
	return obj.insertId
}

const update = async (queryString, args = []) => {
	await pool.query(queryString, args)
}

const _delete = async (queryString, args = []) => {
	await pool.query(queryString, args)
}

const getQueryIds = async () => {
	const queryString = `SELECT id FROM QUERY_TB WHERE is_deleted = 0`
	const result = await selectPlural(queryString, [])
	return result.map((x) => x.id)
}

const getAndConvertQueryOfId = async (queryId) => {
	const queryString = `SELECT query FROM QUERY_TB WHERE id = ?`
	const result = await selectSingular(queryString, [queryId])
	return result.query
}

const getRealTimeQueryIds = async () => {
	const queryString = `SELECT id FROM REAL_TIME_QUERY_TB WHERE is_deleted = 0`
	const result = await selectPlural(queryString, [])
	return result.map((x) => x.id)
}

const getAndConvertRealTimeQueryOfId = async (queryId) => {
	const queryString = `SELECT query FROM REALTIME_QUERY_TB WHERE id = ?`
	const result = await selectSingular(queryString, [queryId])
	return result.query
}

module.exports = {
	selectSingular,
	selectPlural,
	insert,
	update,
	delete: _delete,
	getQueryIds,
	getAndConvertQueryOfId,
	getRealTimeQueryIds,
	getAndConvertRealTimeQueryOfId,
}
