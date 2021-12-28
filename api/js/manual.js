const mysql = require('mysql2/promise')
const {analysis} = require('./config')

const pool = mysql.createPool(Object.assign({
    multipleStatements : true,
    connectionLimit: 200
}, analysis))

const selectSingular = async (queryString, args = []) => {
    const [rows] = await pool.query(queryString, args)
    return rows[0]
}

const selectPlural = async (queryString, args = []) => {
    const [rows] = await pool.query(queryString, args)
    return rows
}

module.exports = {
    selectSingular,
    selectPlural
}