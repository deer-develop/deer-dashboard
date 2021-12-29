const moment = require('moment')

const haha = [
	{ a: 1, b: 2 },
	{ a: 3, b: 4 },
]

const lala = haha.filter((el) => el.a === 3)

console.log(lala)
