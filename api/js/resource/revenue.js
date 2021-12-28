const express = require('express')
const metrics = require('../metrics')
const router = express.Router()

router.get('/indicators', async (req, res) => {
	const { revenue, revenueDayOnDay } = await metrics.getRevenueMetric()

	res.status(201).json({ revenue, revenueDayOnDay })
})

router.get('/operation/indicators', async (req, res) => {
	const { possessedDeer, deployedDeerRate, activeDeerRate, usePerActiveDeer, averageUsePay } = await metrics.getOperationIndicatorsMetric()

	res.status(201).json({ possessedDeer, deployedDeerRate, activeDeerRate, usePerActiveDeer, averageUsePay })
})

router.get('/operation/last-summary', async (req, res) => {
	const { maximumActiveDeerRate, minimumActiveDeerRate, medianActiveDeerRate, maximumDeployedDeerRate, minimumDeployedDeerRate, medianDeployedDeerRate } = await metrics.getLastOperationSummaryMetric()

	res.status(201).json({
		activeDeerRate: { max: maximumActiveDeerRate, min: minimumActiveDeerRate, med: medianActiveDeerRate },
		deployedDeerRate: { max: maximumDeployedDeerRate, min: minimumDeployedDeerRate, med: medianDeployedDeerRate },
	})
})

router.get('/history', async (req, res) => {
	const revenueHistory = await metrics.getRevenueHistoryMetric()

	res.status(201).json({ revenueHistory })
})

module.exports = router
