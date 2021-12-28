const express = require('express');
const metrics = require('../metrics');
const router = express.Router();

router.get('/indicators', async (req, res) => {
    const { retention, retentionReferenceMonth, retentionReferenceDate } = await metrics.getEarlyStageRetentionMetric()

    res.status(201).json( { retention, retentionReferenceMonth, retentionReferenceDate } )
});

router.get('/history', async (req, res) => {
    const retentionHistory = await metrics.getEarlyStageRetentionHistoryMetric()

    res.status(201).json( { retentionHistory } )
});

router.get('/cohort', async (req, res) => {
    const { retentionCohortPoolSize, retentionCohortPercentage } = await metrics.getEarlyStageRetentionCohortMetric()

    res.status(201).json( { retentionCohortPoolSize, retentionCohortPercentage } )
});

module.exports = router;