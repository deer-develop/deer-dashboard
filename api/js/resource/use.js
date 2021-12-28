const express = require('express');
const metrics = require('../metrics');
const router = express.Router();

router.get('/indicators', async (req, res) => {
    const { totalUse, totalUseDayOnDay } = await metrics.getTotalUseMetric()

    res.status(201).json( { totalUse, totalUseDayOnDay } )
});

router.get('/history', async (req, res) => {
    const totalUseHistory = await metrics.getTotalUseHistoryMetric()

    res.status(201).json( { totalUseHistory } )
});

router.get('/dissatisfaction/indicators', async (req, res) => {
    const { useDissatisfactionRatio, useDissatisfactionDayOnWeek, useDissatisfactionProportion } = await metrics.getUseDissatisfactionMetric()

    res.status(201).json( { useDissatisfactionRatio, useDissatisfactionDayOnWeek, useDissatisfactionProportion } )
});

router.get('/dissatisfaction/details/:type', async (req, res) => {
    const type = req.params.type
    const top4UseDissatisfactionProportion = await metrics.getUseDissatisfactionDetailsMetric(type)

    res.status(201).json( { top4UseDissatisfactionProportion } )
});

module.exports = router;