const express = require('express');
const metrics = require('../metrics');
const router = express.Router();

router.get('/conversion', async (req, res) => {
    const userActivationConversion = await metrics.getUserActivationMetric()
    const licenseRequiredUserActivation = await metrics.getLicenseRequiredUserActivationMetric()
    const licenseNotRequiredUserActivation = await metrics.getLicenseNotRequiredUserActivationMetric()

    res.status(201).json( { userActivationConversion, licenseRequiredUserActivation, licenseNotRequiredUserActivation } )
});

router.get('/new-user', async (req, res) => {
    const { newUser, newUserDayOnDay } = await metrics.getNewUserMetric()

    res.status(201).json( { newUser, newUserDayOnDay } )
});

router.get('/history', async (req, res) => {
    // const userActivationHistory = await metrics.getUserActivationHistoryMetric()
    const newUserHistory = await metrics.getNewUserHistoryMetric()

    res.status(201).json( { newUserHistory } )
});

module.exports = router;