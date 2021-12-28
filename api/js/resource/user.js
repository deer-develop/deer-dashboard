const express = require('express');
const metrics = require('../metrics');
const router = express.Router();

router.get('/proportion/indicators/:type', async (req, res) => {
    const type = req.params.type
    let userType
    if (type === 'core') {
        userType = 'core_all_12_weeks'
    } else if (type === 'active') {
        userType = 'active'
    }

    const { userProportion, inflowUser, outflowUser } = await metrics.getUserProportionMetric(userType)

    res.status(201).json( { userProportion, inflowUser, outflowUser } )
});

router.get('/proportion/history/:type', async (req, res) => {
    const type = String(req.params.type)
    let userType
    if (type === 'core') {
        userType = 'core_all_12_weeks'
    } else if (type === 'active') {
        userType = 'active'
    }

    const userProportionHistory = await metrics.getUserProportionHistoryMetric(userType)

    res.status(201).json( { userProportionHistory } )
});

router.get('/activity-rate/indicators', async (req, res) => {
    const { 
        coreUserActivityRate, 
        coreUserActivityRateDayOnDay } = await metrics.getCoreUserActivityRateMetric()
    const { 
        activeUserActivityRate, 
        activeUserActivityRateDayOnDay } = await metrics.getActiveUserActivityRateMetric()

    res.status(201).json( { coreUserActivityRate, coreUserActivityRateDayOnDay, activeUserActivityRate, activeUserActivityRateDayOnDay } )
});

router.get('/activity-rate/history', async (req, res) => {
    const coreUserActivityRateHistory = await metrics.getCoreUserActivityRateHistory()
    const activeUserActivityRateHistory = await metrics.getActiveUserActivityRateHistoryMetric()

    res.status(201).json( { coreUserActivityRateHistory, activeUserActivityRateHistory } )
});

router.get('/cohort', async (req, res) => {
    const { retentionCohortPoolSize, retentionCohortPercentage } = await metrics.getCoreRetentionCohortMetric()

    res.status(201).json( { retentionCohortPoolSize, retentionCohortPercentage } )
});

module.exports = router;