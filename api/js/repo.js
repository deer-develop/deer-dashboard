const { GoogleSpreadsheet } = require('google-spreadsheet')
const request = require('request-promise')
const moment = require('moment-timezone')
const { amplitude, google } = require('./config')
const dashboard = require('./dashboard')
const googleSheet = require('./dashboard-330309-da565d305736.json')

//기본 설정
const doc = new GoogleSpreadsheet(google.sheetID)
const referenceDate = new Date(1899, 11, 30)
const now = new Date()
const dateDiff = moment(now).diff(moment(referenceDate), 'day') - 1

const getQueryResultQuery = 'SELECT value FROM QUERY_RESULT_TB QR JOIN QUERY_TB Q ON QR.query_id = Q.id WHERE comment = ? ORDER BY QR.created_at DESC LIMIT 1'
const getRealTimeQueryResultQuery = 'SELECT value FROM REAL_TIME_QUERY_RESULT_TB QR JOIN REAL_TIME_QUERY_TB Q ON QR.query_id = Q.id WHERE comment = ? ORDER BY QR.created_at DESC LIMIT 1'
const getLastRealTimeQueryResultQuery = 'SELECT value FROM REAL_TIME_QUERY_RESULT_TB QR JOIN REAL_TIME_QUERY_TB Q ON QR.query_id = Q.id WHERE comment = ? AND reference_date = ? AND reference_hour = ? AND reference_minute = ?'
const getQueryResultHistoryQuery = `SELECT reference_date, value FROM QUERY_RESULT_TB QR JOIN QUERY_TB Q ON QR.query_id = Q.id WHERE comment = ? AND reference_date BETWEEN CURDATE() - INTERVAL ? MONTH AND CURDATE() ORDER BY reference_date`
const currentDate = moment().format('YYYY-MM-DD')
const yesterdayDate = moment().subtract(1, 'day').format('YYYY-MM-DD')
const currentHour = moment().format('HH')
const currentMinute = moment().format('mm')

//자주 사용되는 함수
function convertValueStringToNumber(object) {
	const result = {}

	for (const value in object) {
		result[value] = Number(object[value])
	}

	return result
}

//본격 데이터 불러오기
//GoogleSheet
async function authGoogleSheet() {
	try {
		await doc.useServiceAccountAuth(googleSheet)
		await doc.loadInfo()
	} catch (err) {
		console.log('AUTH ERROR', err)
	}
}

async function readGoogleSheet(index) {
	const sheetOfCsManager = doc.sheetsByIndex[index]
	let columnIndex = sheetOfCsManager.columnCount - 1
	let columnValueIndex

	await sheetOfCsManager.loadCells({
		startRowIndex: 0,
		endRowIndex: 44,
		startColumnIndex: 0,
		endColumnIndex: sheetOfCsManager.columnCount - 1,
	})

	do {
		columnIndex--
		columnValueIndex = sheetOfCsManager.getCell(0, columnIndex).value
	} while (columnValueIndex === null)

	for (i = columnIndex; i >= 0; i--) {
		let columnValue = sheetOfCsManager.getCell(0, i).value

		if (columnValue === dateDiff) {
			const dateColumnIndex = i
			return { sheetOfCsManager, dateColumnIndex }
		} else if (columnValue < dateDiff) {
			const dateColumnIndex = i
			return { sheetOfCsManager, dateColumnIndex }
		}
	}

	return
}

async function getGoogleSheetValue(index) {
	await authGoogleSheet()
	const { sheetOfCsManager, dateColumnIndex } = await readGoogleSheet(index)

	let key = []
	let value = []
	let result = {}

	const rows = await sheetOfCsManager.getRows({ offset: 1, limit: 44 })

	rows.forEach((element) => {
		key.push(element._rawData[2])
		value.push(element._rawData[dateColumnIndex])
	})

	const realValue = value.map((element) => {
		if (element === undefined) {
			return 0
		} else {
			return Number(element)
		}
	})

	for (let i = 0; i < key.length; i++) {
		result[key[i]] = realValue[i]
	}

	return result
}

//Amplitude
async function getAmplitudeValue(url) {
	const body = await request.get(url, {
		auth: {
			user: amplitude.apiKey,
			pass: amplitude.secretKey,
		},
	})

	const object = JSON.parse(body)
	const value = object['data'][0]['cumulativeRaw']

	return value
}

//Nps 지표
async function getNpsSectionIndicators(npsGroup) {
	const npsFigureQuery = `
        SELECT SUM(score >= 9) AS promoters, SUM(score BETWEEN 7 AND 8) AS passives, SUM(score <= 6) AS detractors
        FROM NPS_TB
        WHERE DATE(created_at) BETWEEN CURDATE() - INTERVAL 7 DAY AND CURDATE() - INTERVAL 1 DAY`
	const lastNpsFigureQuery = `
        SELECT SUM(score >= 9) AS last_promoters, SUM(score BETWEEN 7 AND 8) AS last_passives, SUM(score <= 6) AS last_detractors
        FROM NPS_TB
        WHERE DATE(created_at) BETWEEN CURDATE() - INTERVAL 14 DAY AND CURDATE() - INTERVAL 8 DAY`
	const scoreDistributionQuery = `
        SELECT SUM(score = 0) AS zero,
            SUM(score = 1) AS one, SUM(score = 2) AS two, SUM(score = 3) AS three, 
            SUM(score = 4) AS four, SUM(score = 5) AS five, SUM(score = 6) AS six, 
            SUM(score = 7) AS seven, SUM(score = 8) AS eight, SUM(score = 9) AS nine, 
            SUM(score = 10) AS ten
        FROM NPS_TB
        WHERE DATE(created_at) BETWEEN CURDATE() - INTERVAL 7 DAY AND CURDATE() - INTERVAL 1 DAY`
	const npsDissatisfactionProportionQuery = `
        SELECT COUNT(*) AS groupTotal, 
        SUM(inconveniences LIKE '%가격%') AS price,
        SUM(inconveniences LIKE '%헬멧%') AS helmet,
        SUM(inconveniences LIKE '%앱 사용%') AS app,
        SUM(inconveniences LIKE '%고객 응대%') AS cs,
        SUM(inconveniences LIKE '%킥보드 기기%') AS hardware,
        SUM(inconveniences LIKE '%반납 금지 구역%') AS forbidden,
        SUM(inconveniences LIKE '%이용 가능 지역%') AS area,
        SUM(inconveniences LIKE '%타고 싶을 때 없음%') AS tatad,
        SUM(inconveniences LIKE '%속도가 너무 빠름%') AS too_fast,
        SUM(inconveniences LIKE '%속도가 너무 느림%') AS too_slow
        FROM NPS_TB
        WHERE DATE(created_at) BETWEEN CURDATE() - INTERVAL 7 DAY AND CURDATE() - INTERVAL 1 DAY
        AND score BETWEEN ? AND ?`

	let scoreRange = []
	if (npsGroup === 'total') {
		scoreRange = [0, 10]
	} else if (npsGroup === 'promoters') {
		scoreRange = [9, 10]
	} else if (npsGroup === 'passives') {
		scoreRange = [7, 8]
	} else if (npsGroup === 'detractors') {
		scoreRange = [0, 6]
	}

	const npsFigure = await dashboard.selectSingular(npsFigureQuery)
	const lastNpsFigure = await dashboard.selectSingular(lastNpsFigureQuery)
	const scoreDistribution = await dashboard.selectSingular(scoreDistributionQuery)
	const npsDissatisfactionProportion = await dashboard.selectSingular(npsDissatisfactionProportionQuery, scoreRange)

	const npsFigureResult = convertValueStringToNumber(npsFigure)
	const lastNpsFigureResult = convertValueStringToNumber(lastNpsFigure)
	const scoreDistributionResult = convertValueStringToNumber(scoreDistribution)
	const npsDissatisfactionProportionResult = convertValueStringToNumber(npsDissatisfactionProportion)

	const result = Object.assign({}, npsFigureResult, lastNpsFigureResult, scoreDistributionResult, npsDissatisfactionProportionResult)

	return result
}

//specific TB
async function getUserProportionIndicators(type) {
	const userProportionIndicatorsQuery = `
        SELECT reference_date, denominator, numerator, intersection
        FROM USER_PROPORTION_TB
        WHERE type_name = ?
        ORDER BY reference_date DESC
        LIMIT 2
    `

	const userProportionIndicators = await dashboard.selectPlural(userProportionIndicatorsQuery, [type])

	return userProportionIndicators
}

async function getUserProportionHistory(type) {
	const userProportionHistoryQuery = `
        SELECT reference_date, denominator, numerator, intersection
        FROM USER_PROPORTION_TB
        WHERE type_name = ?
        AND reference_date BETWEEN CURDATE() - INTERVAL 6 MONTH AND CURDATE() - INTERVAL 1 DAY
    `

	const userProportionHistory = await dashboard.selectPlural(userProportionHistoryQuery, [type])

	return userProportionHistory
}

async function getDailyActiveCoreUser() {
	const dailyActiveCoreUserQuery = `
        SELECT value
        FROM CORE_USER_ACTIVITY_RATE_TB
        ORDER BY created_at DESC
        LIMIT 1
    `

	const result = await dashboard.selectPlural(dailyActiveCoreUserQuery)

	return result[0]['value']
}

async function getLastDailyActiveCoreUser() {
	const lastDailyActiveCoreUserQuery = `
        SELECT value
        FROM CORE_USER_ACTIVITY_RATE_TB
        WHERE reference_date = ? 
        AND reference_hour = ? 
        AND reference_minute = ?
    `
	const referenceHour = currentHour
	const referenceMinute = (parseInt(parseInt(currentMinute) / 15) * 15).toString()

	const result = await dashboard.selectPlural(lastDailyActiveCoreUserQuery, [yesterdayDate, referenceHour, referenceMinute])

	return result[0]['value']
}

async function getDailyActiveCoreUserHistory() {
	const dailyActiveCoreUserHistoryQuery = `
        SELECT value
        FROM CORE_USER_ACTIVITY_RATE_TB
        WHERE reference_date BETWEEN CURDATE() - INTERVAL 6 MONTH AND CURDATE() - INTERVAL 1 DAY
        AND reference_hour = 23 AND reference_minute = 45
    `

	const coreDailyActiveCoreUserHistory = await dashboard.selectPlural(dailyActiveCoreUserHistoryQuery)

	return coreDailyActiveCoreUserHistory
}

async function getLastOperationalIndicators() {
	const lastActiveDeerQuery = `
        SELECT value 
        FROM REAL_TIME_QUERY_RESULT_TB QR JOIN REAL_TIME_QUERY_TB Q ON QR.query_id = Q.id
        WHERE Q.comment = 'ACTIVE_DEER_COUNT'  
        AND reference_date BETWEEN CURDATE() - INTERVAL 7 DAY AND CURDATE() - INTERVAL 1 DAY`
	const lastDeployedDeerQuery = `
        SELECT value 
        FROM REAL_TIME_QUERY_RESULT_TB QR JOIN REAL_TIME_QUERY_TB Q ON QR.query_id = Q.id
        WHERE Q.comment = 'DEPLOYED_DEER_COUNT'
        AND reference_date BETWEEN CURDATE() - INTERVAL 7 DAY AND CURDATE() - INTERVAL 1 DAY`

	const lastActiveDeer = await dashboard.selectPlural(lastActiveDeerQuery)
	const lastDeployedDeer = await dashboard.selectPlural(lastDeployedDeerQuery)
	let lastActiveDeerResult = []
	let lastDeployedDeerResult = []

	for (let i = 0; i < lastActiveDeer.length; i++) {
		lastActiveDeerResult.push(lastActiveDeer[i]['value'])
		lastDeployedDeerResult.push(lastDeployedDeer[i]['value'])
	}

	return { lastActiveDeerResult, lastDeployedDeerResult }
}

async function getLastUseDissatisfactionRatio() {
	const lastTotalUseQuery = `
        SELECT SUM(value) AS value
        FROM QUERY_RESULT_TB QR JOIN QUERY_TB Q ON QR.query_id = Q.id
        WHERE Q.comment = 'TOTAL_USE_COUNT'
        AND QR.reference_date BETWEEN CURDATE() - INTERVAL 8 DAY AND CURDATE() - INTERVAL 2 DAY`
	const lastUseDissatisfactionQuery = `
        SELECT SUM(value) AS value
        FROM QUERY_RESULT_TB QR JOIN QUERY_TB Q ON QR.query_id = Q.id
        WHERE Q.comment IN ('USER_DISSATISFACTION_ISSUE', 'USER_DISSATISFACTION_BREAKDOWN', 'USER_DISSATISFACTION_FEEDBACK')
        AND QR.reference_date BETWEEN CURDATE() - INTERVAL 8 DAY AND CURDATE() - INTERVAL 2 DAY`

	const lastTotalUse = await dashboard.selectPlural(lastTotalUseQuery)
	const lastUseDissatisfaction = await dashboard.selectPlural(lastUseDissatisfactionQuery)
	const lastUseDissatisfactionRatio = (lastUseDissatisfaction[0]['value'] * 100) / lastTotalUse[0]['value']

	return lastUseDissatisfactionRatio
}

async function getRetentionCohort() {
	const earlyStageRetentionCohortQuery = `
        SELECT week_number, registered_date, retained_user
        FROM RETENTION_COHORT_TB
        WHERE type_name = 'early_stage'
        AND DATE(registered_date) > CURDATE() - INTERVAL 63 DAY `
	const coreRetentionCohortQuery = `
        SELECT week_number, registered_date, retained_user
        FROM RETENTION_COHORT_TB
        WHERE type_name = 'core_all_12_weeks'
        AND DATE(registered_date) >= CURDATE() - INTERVAL 56 DAY `

	const earlyStageRetentionCohort = await dashboard.selectPlural(earlyStageRetentionCohortQuery)
	const coreRetentionCohort = await dashboard.selectPlural(coreRetentionCohortQuery)

	return { earlyStageRetentionCohort, coreRetentionCohort }
}

async function getUserActivationIndicators() {
	const userActivationIndicatorsQuery = `
        SELECT type_name, create_account, first_use
        FROM SIGN_UP_CONVERSION_TB
        WHERE reference_date = CURDATE() - INTERVAL 1 DAY
    `

	const userActivationIndicators = await dashboard.selectPlural(userActivationIndicatorsQuery)

	return userActivationIndicators
}

async function getUserActivationHistory() {
	const userActivationHistoryQuery = `
        SELECT reference_date, install_app, first_use
        FROM SIGN_UP_CONVERSION_TB
        WHERE reference_date BETWEEN CURDATE() - INTERVAL 3 MONTH AND CURDATE()
        ORDER BY reference_date
    `

	const userActivationHistory = await dashboard.selectPlural(userActivationHistoryQuery)

	return userActivationHistory
}

//query TB
async function getQueryResult(comment) {
	const result = await dashboard.selectPlural(getQueryResultQuery, [comment])

	return result[0]['value']
}

async function getRealTimeQueryResult(comment) {
	const result = await dashboard.selectPlural(getRealTimeQueryResultQuery, [comment])

	return result[0]['value']
}

async function getLastRealTimeQueryResult(comment) {
	const referenceHour = currentHour
	const referenceMinute = (parseInt(parseInt(currentMinute) / 15) * 15).toString()

	const result = await dashboard.selectPlural(getLastRealTimeQueryResultQuery, [comment, yesterdayDate, referenceHour, referenceMinute])

	return result[0]['value']
}

async function getQueryResultHistory(comment, spanMonths) {
	const result = await dashboard.selectPlural(getQueryResultHistoryQuery, [comment, spanMonths])

	return result
}

//console.log 찍기
async function print() {
	const result = await getUserProportionIndicators('active')
	console.log(result)
}

// print()

module.exports = {
	getGoogleSheetValue,
	getAmplitudeValue,
	getNpsSectionIndicators,
	getUserProportionIndicators,
	getUserProportionHistory,
	getDailyActiveCoreUser,
	getLastDailyActiveCoreUser,
	getDailyActiveCoreUserHistory,
	getLastOperationalIndicators,
	getLastUseDissatisfactionRatio,
	getRetentionCohort,
	getUserActivationIndicators,
	getUserActivationHistory,
	getQueryResult,
	getRealTimeQueryResult,
	getLastRealTimeQueryResult,
	getQueryResultHistory,
}
