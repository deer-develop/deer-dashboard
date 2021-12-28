const express = require('express');
const metrics = require('../metrics');
const router = express.Router();

router.get('/indicators', async (req, res) => {
    const { npsScore, npsScoreWeekOnWeek, npsScoreDistribution } = await metrics.getNpsMetric('total')

    res.status(201).json( { npsScore, npsScoreWeekOnWeek, npsScoreDistribution } )
});

router.get('/dissatisfaction/:group', async (req, res) => {
    const npsGroup = req.params.group
    const { top6NpsDissatisfactionProportion } = await metrics.getNpsMetric(npsGroup)

    res.status(201).json( { top6NpsDissatisfactionProportion } )
});

module.exports = router;