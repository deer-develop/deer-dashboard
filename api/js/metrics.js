const moment = require('moment-timezone')
const _ = require('lodash')
const repo = require('./repo')

//기본 설정
const possessedDeer = 15694
const now = new Date() //현재 시각과 동일한지 확인하기
const startDate = moment().subtract(1, 'days').format('YYYYMMDD')
const endDate = moment().format('YYYYMMDD')
const licenseRequiredUrl = `https://amplitude.com/api/2/funnels?
            e=${encodeURIComponent(JSON.stringify({ event_type: 'CLICK_AGREE_AND_NEXT_ON_SIGN_UP' }))}
            &e=${encodeURIComponent(JSON.stringify({ event_type: 'CELEBRATE_USER_REGISTRATION_MODAL_ON_SIGN_UP' }))}
            &e=${encodeURIComponent(JSON.stringify({ event_type: 'REGISTER_PAYMENT' }))}
            &e=${encodeURIComponent(JSON.stringify({ event_type: 'REGISTER_LICENSE' }))}
            &e=${encodeURIComponent(JSON.stringify({ event_type: 'USE_START' }))}
            &s=${encodeURIComponent(JSON.stringify([{ prop: 'gp:areaId', op: 'is', values: ['1', '10', '20', '37', '40', '49', '88', '129'] }]))}&start=${startDate}&end=${endDate}`
const licenseNotRequiredUrl = `https://amplitude.com/api/2/funnels?
            e=${encodeURIComponent(JSON.stringify({ event_type: 'CLICK_AGREE_AND_NEXT_ON_SIGN_UP' }))}
            &e=${encodeURIComponent(JSON.stringify({ event_type: 'CELEBRATE_USER_REGISTRATION_MODAL_ON_SIGN_UP' }))}
            &e=${encodeURIComponent(JSON.stringify({ event_type: 'REGISTER_PAYMENT' }))}
            &e=${encodeURIComponent(JSON.stringify({ event_type: 'USE_START' }))}
            &s=${encodeURIComponent(JSON.stringify([{ prop: 'gp:areaId', op: 'is not', values: ['1', '10', '20', '37', '40', '49', '88', '129'] }]))}&start=${startDate}&end=${endDate}`

//자주 사용되는 함수
Array.prototype.median = function () {
	const mdn = Math.floor(this.length / 2)

	if (this.length % 2 === 0) {
		return (this.sort()[mdn - 1] + this.sort()[mdn - 1]) / 2
	} else {
		return this.sort()[mdn]
	}
}

function round(value, decimals) {
	return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals)
}

//본격 데이터 가공하기
//activation
async function getUserActivationMetric() {
	const userActivationIndicators = await repo.getUserActivationIndicators()
	const licenseRequiredUserActivation = userActivationIndicators[0]
	const licenseNotRequiredUserActivation = userActivationIndicators[1]

	const totalCreateAccount = licenseRequiredUserActivation.create_account + licenseNotRequiredUserActivation.create_account
	const totalFirstUse = licenseRequiredUserActivation.first_use + licenseNotRequiredUserActivation.first_use
	const userActivationConversion = round((totalFirstUse * 100) / totalCreateAccount, 1)

	return userActivationConversion
}

async function getUserActivationHistoryMetric() {
	let userActivationHistory = await repo.getUserActivationHistory()

	for (let i = 0; i < userActivationHistory.length; i++) {
		userActivationHistory[i]['user_activation'] = round((userActivationHistory[i]['first_use'] * 100) / userActivationHistory[i]['install_app'], 2)
		delete userActivationHistory[i]['first_use']
		delete userActivationHistory[i]['install_app'][('first_use', 'install_app')].forEach(function (key) {
			delete userActivationHistory[i][key]
		})
	}

	return userActivationHistory
}

async function getLicenseRequiredUserActivationMetric() {
	const [createAccount, registerPayment, registerLicense, firstUse] = await repo.getAmplitudeValue(licenseRequiredUrl)

	const registerPaymentConversion = round((registerPayment * 100) / createAccount, 1)
	const registerLicenseConversion = round((registerLicense * 100) / registerPayment, 1)
	const firstUseConversion = round((firstUse * 100) / registerLicense, 1)

	const absoluteRegisterPaymentConversion = round((registerPayment * 100) / createAccount, 1)
	const absoluteRegisterLicenseConversion = round((registerLicense * 100) / createAccount, 1)
	const absoluteFirstUseConversion = round((firstUse * 100) / createAccount, 1)

	const licenseRequiredUserActivation = [
		{ item: '회원가입', relativeProportion: 100, currentProportion: 100, previousProportion: 100 },
		{ item: '결제 등록', relativeProportion: registerPaymentConversion, currentProportion: absoluteRegisterPaymentConversion, previousProportion: 100 },
		{ item: '면허 등록', relativeProportion: registerLicenseConversion, currentProportion: absoluteRegisterLicenseConversion, previousProportion: absoluteRegisterPaymentConversion },
		{ item: '첫 이용', relativeProportion: firstUseConversion, currentProportion: absoluteFirstUseConversion, previousProportion: absoluteRegisterLicenseConversion },
	]

	return licenseRequiredUserActivation
}

async function getLicenseNotRequiredUserActivationMetric() {
	const [createAccount, registerPayment, firstUse] = await repo.getAmplitudeValue(licenseNotRequiredUrl)

	const registerPaymentConversion = round((registerPayment * 100) / createAccount, 1)
	const firstUseConversion = round((firstUse * 100) / registerPayment, 1)

	const absoluteRegisterPaymentConversion = round((registerPayment * 100) / createAccount, 1)
	const absoluteFirstUseConversion = round((firstUse * 100) / registerPayment, 1)

	const licenseNotRequiredUserActivation = [
		{ item: '회원가입', relativeProportion: 100, currentProportion: 100, previousProportion: 100 },
		{ item: '결제 등록', relativeProportion: registerPaymentConversion, currentProportion: absoluteRegisterPaymentConversion, previousProportion: 100 },
		{ item: '첫 이용', relativeProportion: firstUseConversion, currentProportion: absoluteFirstUseConversion, previousProportion: absoluteRegisterPaymentConversion },
	]

	return licenseNotRequiredUserActivation
}

async function getNewUserMetric() {
	const newUser = await repo.getRealTimeQueryResult('NEW_USER_COUNT')
	const lastNewUser = await repo.getLastRealTimeQueryResult('NEW_USER_COUNT')

	const newUserDayOnDay = newUser - lastNewUser

	return { newUser, newUserDayOnDay }
}

async function getNewUserHistoryMetric() {
	const newUserHistory = await repo.getQueryResultHistory('NEW_USER_COUNT', 3)

	return newUserHistory
}

//cash

//nps
async function getNpsMetric(npsGroup) {
	const {
		promoters,
		passives,
		detractors,
		last_promoters,
		last_passives,
		last_detractors,
		zero,
		one,
		two,
		three,
		four,
		five,
		six,
		seven,
		eight,
		nine,
		ten,
		groupTotal,
		price,
		helmet,
		app,
		cs,
		hardware,
		forbidden,
		area,
		tatad,
		tooFast,
		tooSlow,
	} = await repo.getNpsSectionIndicators(npsGroup)

	const totalRespondent = promoters + passives + detractors
	const lastTotalRespondent = last_promoters + last_passives + last_detractors

	let npsScore = ((promoters - detractors) * 100) / totalRespondent
	const lastNpsScore = ((last_promoters - last_detractors) * 100) / lastTotalRespondent
	const npsScoreWeekOnWeek = round(npsScore - lastNpsScore, 1)
	npsScore = round(npsScore, 1)

	const npsScoreDistribution = [
		{ score: '0', group: 'detractors', count: zero },
		{ score: '1', group: 'detractors', count: one },
		{ score: '2', group: 'detractors', count: two },
		{ score: '3', group: 'detractors', count: three },
		{ score: '4', group: 'detractors', count: four },
		{ score: '5', group: 'detractors', count: five },
		{ score: '6', group: 'detractors', count: six },
		{ score: '7', group: 'passives', count: seven },
		{ score: '8', group: 'passives', count: eight },
		{ score: '9', group: 'promoters', count: nine },
		{ score: '10', group: 'promoters', count: ten },
	]
	const npsDissatisfactionObject = { price, helmet, app, cs, hardware, forbidden, area, tatad, tooFast, tooSlow }
	let npsDissatisfactionArray = []
	let top6NpsDissatisfactionProportion = []

	for (let npsDissatisfaction in npsDissatisfactionObject) {
		npsDissatisfactionArray.push([npsDissatisfaction, round((npsDissatisfactionObject[npsDissatisfaction] * 100) / groupTotal, 1)])
	}

	npsDissatisfactionArray.sort(function (a, b) {
		return b[1] - a[1]
	})

	for (let i = 5; i >= 0; i--) {
		switch (npsDissatisfactionArray[i][0]) {
			case 'price':
				npsDissatisfactionArray[i][0] = '가격'
				break
			case 'helmet':
				npsDissatisfactionArray[i][0] = '헬멧'
				break
			case 'app':
				npsDissatisfactionArray[i][0] = '앱 사용'
				break
			case 'cs':
				npsDissatisfactionArray[i][0] = '고객 응대'
				break
			case 'hardware':
				npsDissatisfactionArray[i][0] = '킥보드 기기'
				break
			case 'forbidden':
				npsDissatisfactionArray[i][0] = '반납 금지 구역'
				break
			case 'area':
				npsDissatisfactionArray[i][0] = '이용 가능 지역'
				break
			case 'tatad':
				npsDissatisfactionArray[i][0] = '타고 싶을 때 없음'
				break
			case 'tooFast':
				npsDissatisfactionArray[i][0] = '속도 느림'
				break
			case 'tooSlow':
				npsDissatisfactionArray[i][0] = '속도 빠름'
				break
		}
		top6NpsDissatisfactionProportion.push({ item: npsDissatisfactionArray[i][0], proportion: npsDissatisfactionArray[i][1] })
	}

	return { npsScore, npsScoreWeekOnWeek, npsScoreDistribution, top6NpsDissatisfactionProportion }
}

//retention
async function getEarlyStageRetentionMetric() {
	let retention = await repo.getQueryResult('EARLY_STAGE_RETENTION')
	retention = round(retention * 100, 1)
	const retentionReference = moment().subtract(15, 'day')
	const retentionReferenceMonth = retentionReference.month() + 1
	const retentionReferenceDate = retentionReference.date()

	return { retention, retentionReferenceMonth, retentionReferenceDate }
}

async function getEarlyStageRetentionHistoryMetric() {
	let retentionHistory = await repo.getQueryResultHistory('EARLY_STAGE_RETENTION', 3)

	for (let i = 0; i < retentionHistory.length; i++) {
		retentionHistory[i]['value'] = round(retentionHistory[i]['value'] * 100, 1)
	}

	return retentionHistory
}

async function getEarlyStageRetentionCohortMetric() {
	const { earlyStageRetentionCohort } = await repo.getRetentionCohort()
	let retentionCohortArray = Array(9)
		.fill(0)
		.map((_, i) => Array(i + 1).fill(0))
	let retentionCohortPoolSize = Array(9).fill(0)
	let retentionCohortPercentageArray = []
	let retentionCohortPercentage = []

	for (let i = 0; i < earlyStageRetentionCohort.length; i++) {
		const registeredDate = earlyStageRetentionCohort[i]['registered_date']
		const dateDiff = moment().diff(registeredDate, 'days')
		let index = Math.floor(dateDiff / 7)
		console.log(index)
		for (let j = 0; j < 9; j++) {
			if (earlyStageRetentionCohort[i]['week_number'] === j) {
				retentionCohortArray[index][j] += earlyStageRetentionCohort[i]['retained_user']
				if (j === 0) {
					retentionCohortPoolSize[index] += earlyStageRetentionCohort[i]['retained_user']
				}
			}
		}
	}

	//retention percentage로 기존 값을 대체
	for (let i = 0; i < retentionCohortArray.length; i++) {
		let subArray = retentionCohortArray[i].map((x) => {
			return retentionCohortPoolSize[i] ? round((x * 100) / retentionCohortPoolSize[i], 1) : 0
		})
		retentionCohortPercentageArray.push(subArray)
	}

	//lodash로 배열 길이를 9로 통일
	for (let i = 0; i < retentionCohortPercentageArray.length; i++) {
		retentionCohortPercentageArray[i] = _.assign(_.fill(new Array(9), 0), retentionCohortPercentageArray[i])
	}

	//visx 친화적인 형태로 데이터 가공
	for (let i = 0; i < 9; i++) {
		retentionCohortPercentage.push({
			bin: moment().subtract(i, 'week').format('MM월 DD일'), //registered_date
			bins: retentionCohortPercentageArray[i].map((percentage, idx) => ({
				//retention_percentage
				//week_number: idx, value: percentage
				bin: idx,
				count: percentage,
			})),
		})
	}

	return { retentionCohortPoolSize, retentionCohortPercentage }
}

//revenue
async function getRevenueMetric() {
	let revenue = await repo.getRealTimeQueryResult('REVENUE')
	const lastRevenue = await repo.getLastRealTimeQueryResult('REVENUE')

	const revenueDayOnDay = round((revenue - lastRevenue) / 10000, 1)
	revenue = round(revenue / 10000, 1)

	return { revenue, revenueDayOnDay }
}

async function getOperationIndicatorsMetric() {
	let deployedDeer = await repo.getRealTimeQueryResult('DEPLOYED_DEER_COUNT')
	let activeDeer = await repo.getRealTimeQueryResult('ACTIVE_DEER_COUNT')
	const totalUse = await repo.getRealTimeQueryResult('TOTAL_USE_COUNT')
	const revenue = await repo.getRealTimeQueryResult('REVENUE')

	const usePerActiveDeer = round(totalUse / activeDeer, 2)
	const averageUsePay = round(revenue / totalUse, 0)
	activeDeerRate = round((activeDeer * 100) / deployedDeer, 1)
	deployedDeerRate = round((deployedDeer * 100) / possessedDeer, 1)

	return { possessedDeer, deployedDeerRate, activeDeerRate, usePerActiveDeer, averageUsePay }
}

async function getLastOperationSummaryMetric() {
	const { lastActiveDeerResult, lastDeployedDeerResult } = await repo.getLastOperationalIndicators()

	let lastActiveDeerRate = []
	let lastDeployedDeerRate = []

	for (let i = 0; i < 7; i++) {
		lastActiveDeerRate.push((lastActiveDeerResult[i] * 100) / lastDeployedDeerResult[i])
		lastDeployedDeerRate.push((lastDeployedDeerResult[i] * 100) / possessedDeer)
	}

	const maximumActiveDeerRate = round(Math.max(...lastActiveDeerRate), 1)
	const minimumActiveDeerRate = round(Math.min(...lastActiveDeerRate), 1)
	const medianActiveDeerRate = round(lastActiveDeerRate.median(), 1)

	const maximumDeployedDeerRate = round(Math.max(...lastDeployedDeerRate), 1)
	const minimumDeployedDeerRate = round(Math.min(...lastDeployedDeerRate), 1)
	const medianDeployedDeerRate = round(lastDeployedDeerRate.median(), 1)

	return { maximumActiveDeerRate, minimumActiveDeerRate, medianActiveDeerRate, maximumDeployedDeerRate, minimumDeployedDeerRate, medianDeployedDeerRate }
}

async function getRevenueHistoryMetric() {
	let revenueHistory = await repo.getQueryResultHistory('REVENUE', 12)

	for (let i = 0; i < revenueHistory.length; i++) {
		revenueHistory[i]['value'] = round(revenueHistory[i]['value'] / 10000, 1)
	}

	return revenueHistory
}

//use
async function getTotalUseMetric() {
	const totalUse = await repo.getRealTimeQueryResult('TOTAL_USE_COUNT')
	const lastTotalUse = await repo.getLastRealTimeQueryResult('TOTAL_USE_COUNT')

	const totalUseDayOnDay = totalUse - lastTotalUse

	return { totalUse, totalUseDayOnDay }
}

async function getTotalUseHistoryMetric() {
	const totalUseHistory = await repo.getQueryResultHistory('TOTAL_USE_COUNT', 12)

	return totalUseHistory
}

async function getUseDissatisfactionMetric() {
	const lastUseDissatisfactionRatio = await repo.getLastUseDissatisfactionRatio()
	const issue = await repo.getQueryResult('USER_DISSATISFACTION_ISSUE')
	const breakdown = await repo.getQueryResult('USER_DISSATISFACTION_BREAKDOWN')
	const feedback = await repo.getQueryResult('USER_DISSATISFACTION_FEEDBACK')
	const totalUse = await repo.getQueryResult('TOTAL_USE_COUNT')

	const totalUseDissatisfaction = issue + breakdown + feedback
	const issueProportion = round((issue * 100) / totalUseDissatisfaction, 2)
	const breakdownProportion = round((breakdown * 100) / totalUseDissatisfaction, 2)

	let useDissatisfactionRatio = (totalUseDissatisfaction * 100) / totalUse
	const useDissatisfactionDayOnWeek = round(useDissatisfactionRatio - lastUseDissatisfactionRatio, 2)
	useDissatisfactionRatio = round((totalUseDissatisfaction * 100) / totalUse, 2)
	const useDissatisfactionProportion = [{ feedback: round(100 - (issueProportion + breakdownProportion), 2), breakdown: breakdownProportion, issue: issueProportion }]

	return { useDissatisfactionRatio, useDissatisfactionDayOnWeek, useDissatisfactionProportion }
}

async function getUseDissatisfactionDetailsMetric(type) {
	const useDissatisfactionObject1 = await repo.getGoogleSheetValue(4)
	const useDissatisfactionObject2 = await repo.getGoogleSheetValue(5)

	let useDissatisfactionObject = {}
	Object.keys(useDissatisfactionObject1).forEach((index) => {
		useDissatisfactionObject[index] = useDissatisfactionObject1[index] + useDissatisfactionObject2[index]
	})

	const issueArray = Object.entries(useDissatisfactionObject).slice(15, 34)
	const issue = _.sumBy(issueArray, (x) => x[1])
	const breakdownArray = Object.entries(useDissatisfactionObject).slice(0, 14)
	const breakdown = _.sumBy(breakdownArray, (x) => x[1])
	const totalArray = issueArray.concat(breakdownArray)
	let useDissatisfactionArray = []
	let top4UseDissatisfactionProportion = []

	if (type === 'total') {
		totalArray.sort(function (a, b) {
			return b[1] - a[1]
		})

		for (let i = 3; i >= 0; i--) {
			totalArray[i][1] = round((totalArray[i][1] * 100) / (issue + breakdown), 1)
			useDissatisfactionArray.push(totalArray[i])
		}
	} else if (type === 'issue') {
		issueArray.sort(function (a, b) {
			return b[1] - a[1]
		})

		for (let i = 3; i >= 0; i--) {
			issueArray[i][1] = round((issueArray[i][1] * 100) / issue, 1)
			useDissatisfactionArray.push(issueArray[i])
		}
	} else if (type === 'breakdown') {
		breakdownArray.sort(function (a, b) {
			return b[1] - a[1]
		})

		for (let i = 3; i >= 0; i--) {
			breakdownArray[i][1] = round((breakdownArray[i][1] * 100) / breakdown, 1)
			useDissatisfactionArray.push(breakdownArray[i])
		}
	}

	for (let i = 0; i <= 3; i++) {
		switch (useDissatisfactionArray[i][0]) {
			case '반납 X':
				useDissatisfactionArray[i][0] = '반납 안 됨'
				break
			case '파킹존 적립x':
				useDissatisfactionArray[i][0] = '파킹존 적립 안 됨'
				break
		}
		top4UseDissatisfactionProportion.push({ item: useDissatisfactionArray[i][0], proportion: useDissatisfactionArray[i][1] })
	}

	return top4UseDissatisfactionProportion
}

//user
async function getUserProportionMetric(type) {
	const userProportionIndicators = await repo.getUserProportionIndicators(type)
	const recentUserProportion = userProportionIndicators[0]
	const lastUserProportion = userProportionIndicators[1]

	const userProportion = round((recentUserProportion.numerator * 100) / recentUserProportion.denominator, 1)
	const inflowUser = recentUserProportion.numerator - recentUserProportion.intersection
	const outflowUser = lastUserProportion.numerator - recentUserProportion.intersection

	return { userProportion, inflowUser, outflowUser }
}

async function getUserProportionHistoryMetric(type) {
	let userProportionHistory = await repo.getUserProportionHistory(type)

	for (let i = 0; i < userProportionHistory.length; i++) {
		userProportionHistory[i]['value'] = round((userProportionHistory[i]['numerator'] * 100) / userProportionHistory[i]['denominator'], 2)
		;['denominator', 'numerator', 'intersection'].forEach(function (key) {
			delete userProportionHistory[i][key]
		})
	}

	return userProportionHistory
}

async function getCoreUserActivityRateMetric() {
	let dailyActiveCoreUser = await repo.getDailyActiveCoreUser()
	const lastDailyActiveCoreUser = await repo.getLastDailyActiveCoreUser()
	const userProportionIndicators = await repo.getUserProportionIndicators('core_all_12_weeks')
	const coreUser = userProportionIndicators[0]['numerator']

	const coreUserActivityRate = round((dailyActiveCoreUser * 100) / coreUser, 1)
	const dailyActiveCoreUserDayOnDay = dailyActiveCoreUser - lastDailyActiveCoreUser
	const coreUserActivityRateDayOnDay = round((dailyActiveCoreUserDayOnDay * 100) / coreUser, 1)

	return { coreUserActivityRate, coreUserActivityRateDayOnDay }
}

async function getActiveUserActivityRateMetric() {
	const dailyActiveUser = await repo.getRealTimeQueryResult('DAILY_ACTIVE_USER')
	const lastDailyActiveUser = await repo.getLastRealTimeQueryResult('DAILY_ACTIVE_USER')
	const userProportionIndicators = await repo.getUserProportionIndicators('active')
	const lastTotalUser = userProportionIndicators[1]['denominator']
	const newUser = await repo.getRealTimeQueryResult('NEW_USER_COUNT')
	const totalUser = lastTotalUser + newUser

	let activeUserActivityRate = (dailyActiveUser * 100) / totalUser
	let lastActiveUserActivityRate = (lastDailyActiveUser * 100) / lastTotalUser
	const activeUserActivityRateDayOnDay = round(activeUserActivityRate - lastActiveUserActivityRate, 1)
	activeUserActivityRate = round(activeUserActivityRate, 1)

	return { activeUserActivityRate, activeUserActivityRateDayOnDay }
}

async function getCoreUserActivityRateHistoryMetric() {
	const dailyActiveCoreUserHistory = await repo.getDailyActiveCoreUserHistory()
	const totalUserHistory = await repo.getUserProportionHistory('core_all_12_weeks')
	let coreUserActivityRateHistory = []

	for (let i = 0; i < dailyActiveCoreUserHistory.length; i++) {
		const mondayDate = moment(dailyActiveCoreUserHistory[i]['reference_date']).isoWeekday(1)
		const totalUser = totalUserHistory.filter((el) => moment(el.reference_date).format('YY-MM-DD') === mondayDate.format('YY-MM-DD'))
		coreUserActivityRateHistory.push({
			reference_date: dailyActiveCoreUserHistory[i]['reference_date'],
			value: round((dailyActiveCoreUserHistory[i]['value'] * 100) / totalUser[0]['numerator'], 1),
		})
	}

	return coreUserActivityRateHistory
}

async function getActiveUserActivityRateHistoryMetric() {
	let dailyActiveUserHistory = await repo.getQueryResultHistory('DAILY_ACTIVE_USER', 6)
	const totalUserHistory = await repo.getUserProportionHistory('active')
	let activeUserActivityRateHistory = []

	const index = dailyActiveUserHistory.findIndex((x) => x.reference_date.toDateString() === totalUserHistory[0]['reference_date'].toDateString())
	const slicedDailyActiveUserHistory = dailyActiveUserHistory.slice(index)

	for (let i = 0; i < totalUserHistory.length; i++) {
		activeUserActivityRateHistory.push({
			reference_date: totalUserHistory[i]['reference_date'],
			value: round((slicedDailyActiveUserHistory[i]['value'] * 100) / totalUserHistory[i]['denominator'], 1),
		})
	}

	return activeUserActivityRateHistory
}

async function getCoreRetentionCohortMetric() {
	const { coreRetentionCohort } = await repo.getRetentionCohort()
	let retentionCohortArray = Array(9)
		.fill(0)
		.map((_, i) => Array(i + 1).fill(0))
	let retentionCohortPoolSize = Array(9).fill(0)
	let retentionCohortPercentage = []
	let retentionCohortPercentageArray = []

	for (let i = 0; i < coreRetentionCohort.length; i++) {
		const registeredDate = moment(coreRetentionCohort[i]['registered_date'])
		const dateDiff = moment().isoWeekday(1).diff(registeredDate, 'days')

		for (let j = 0; j < 9; j++) {
			if (coreRetentionCohort[i]['week_number'] === j) {
				let index = Math.floor((dateDiff + 1) / 7)
				retentionCohortArray[index][j] += coreRetentionCohort[i]['retained_user']
				if (j === 0) {
					retentionCohortPoolSize[index] += coreRetentionCohort[i]['retained_user']
				}
			}
		}
	}

	//retention percentage로 기존 값을 대체
	for (let i = 0; i < retentionCohortArray.length; i++) {
		let subArray = retentionCohortArray[i].map((x) => {
			return retentionCohortPoolSize[i] ? round((x * 100) / retentionCohortPoolSize[i], 1) : 0
		})
		retentionCohortPercentageArray.push(subArray)
	}

	//lodash로 배열 길이를 9로 통일
	for (let i = 0; i < retentionCohortPercentageArray.length; i++) {
		retentionCohortPercentageArray[i] = _.assign(_.fill(new Array(9), 0), retentionCohortPercentageArray[i])
	}

	//visx 친화적인 형태로 데이터 가공
	for (let i = 0; i < 9; i++) {
		retentionCohortPercentage.push({
			bin: moment().subtract(i, 'week').format('MM월 DD일'), //registered_date
			bins: retentionCohortPercentageArray[i].map((percentage, idx) => ({
				//retention_percentage
				//week_number: idx, value: percentage
				bin: idx,
				count: percentage,
			})),
		})
	}

	return { retentionCohortPoolSize, retentionCohortPercentage }
}

async function print() {
	const result = await getCoreUserActivityRateHistoryMetric()
	console.log(result)
}

print()

module.exports = {
	getUserActivationMetric,
	getUserActivationHistoryMetric,
	getLicenseRequiredUserActivationMetric,
	getLicenseNotRequiredUserActivationMetric,
	getNewUserMetric,
	getNewUserHistoryMetric,
	getNpsMetric,
	getEarlyStageRetentionMetric,
	getEarlyStageRetentionHistoryMetric,
	getEarlyStageRetentionCohortMetric,
	getRevenueMetric,
	getOperationIndicatorsMetric,
	getLastOperationSummaryMetric,
	getRevenueHistoryMetric,
	getTotalUseMetric,
	getTotalUseHistoryMetric,
	getUseDissatisfactionMetric,
	getUseDissatisfactionDetailsMetric,
	getUserProportionMetric,
	getUserProportionHistoryMetric,
	getCoreUserActivityRateMetric,
	getActiveUserActivityRateMetric,
	getCoreUserActivityRateHistoryMetric,
	getActiveUserActivityRateHistoryMetric,
	getCoreRetentionCohortMetric,
}
