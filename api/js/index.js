const moment = require('moment-timezone');
const request = require('request');
const manual = require('./manual');
const dashboard = require('./dashboard');

//기본 설정
const writeQueryResultQuery = 'INSERT INTO QUERY_RESULT_TB(query_id, reference_date, value) VALUES ?'
const writeRealTimeQueryResultQuery = 'INSERT INTO REAL_TIME_QUERY_RESULT_TB(query_id, reference_date, reference_hour, reference_minute, value) VALUES ?'
const writeSignUpConversionQuery = 'INSERT INTO SIGN_UP_CONVERSION_TB(reference_date, type_name, create_account, register_payment, register_license, first_use) VALUES ?'
const writeRetentionCohortQuery = 'INSERT INTO RETENTION_COHORT_TB(reference_date, type_name, week_number, registered_date, retained_user) VALUES ?' 
const writeUserProportionQuery = 'INSERT INTO USER_PROPORTION_TB(reference_date, type_name, denominator, numerator, intersection) VALUES ?'
const writeCoreUserQuery = 'INSERT INTO CORE_USER_TB(user_id, definition, core_period_start_week, core_period_end_week) VALUES ?'
const writeCoreUserActivityRateQuery = 'INSERT INTO CORE_USER_ACTIVITY_RATE_TB(reference_date, reference_hour, reference_minute, value) VALUES ?'
const updateCoreUserQuery = 'UPDATE CORE_USER_TB SET core_period_end_week = ? WHERE user_id = ?'

const startDate = moment().subtract(2, 'days').format('YYYYMMDD')
const endDate = moment().subtract(1, 'days').format('YYYYMMDD')
const licenseRequiredUrl = `https://amplitude.com/api/2/funnels?
            e=${encodeURIComponent(JSON.stringify({"event_type":"CLICK_AGREE_AND_NEXT_ON_SIGN_UP"}))}
            &e=${encodeURIComponent(JSON.stringify({"event_type":"CELEBRATE_USER_REGISTRATION_MODAL_ON_SIGN_UP"}))}
            &e=${encodeURIComponent(JSON.stringify({"event_type":"REGISTER_PAYMENT"}))}
            &e=${encodeURIComponent(JSON.stringify({"event_type":"REGISTER_LICENSE"}))}
            &e=${encodeURIComponent(JSON.stringify({"event_type":"USE_START"}))}
            &s=${encodeURIComponent(JSON.stringify([{"prop":"gp:areaId", "op":"is", "values":["1", "10", "20", "37", "40", "49", "88", "129"]}]))}&start=${startDate}&end=${endDate}`
const licenseNotRequiredUrl = `https://amplitude.com/api/2/funnels?
            e=${encodeURIComponent(JSON.stringify({"event_type":"CLICK_AGREE_AND_NEXT_ON_SIGN_UP"}))}
            &e=${encodeURIComponent(JSON.stringify({"event_type":"CELEBRATE_USER_REGISTRATION_MODAL_ON_SIGN_UP"}))}
            &e=${encodeURIComponent(JSON.stringify({"event_type":"REGISTER_PAYMENT"}))}
            &e=${encodeURIComponent(JSON.stringify({"event_type":"USE_START"}))}
            &s=${encodeURIComponent(JSON.stringify([{"prop":"gp:areaId", "op":"is not", "values":["1", "10", "20", "37", "40", "49", "88", "129"]}]))}&start=${startDate}&end=${endDate}`

//본격 데이터 쌓기
//Amplitude
async function getAmplitudeValue(url, callbackFunc) {
    request.get(url, {
        'auth': {
            'user': 'c97d886c9c4dba491ae0a93bc601241f',
            'pass': 'e021ec65b5e1e6745eccdd8e08acc22d'
        }
    }, function(error, response, body) {
        //callback
        const object = JSON.parse(body)
        const value = object["data"][0]["cumulativeRaw"]
        callbackFunc(value)
    });
};

async function writeAmplitudeValue() {
    const referenceDate = moment().format('YYYY-MM-DD')
    const rowsToInsert = []

    await getAmplitudeValue(licenseRequiredUrl, function(response) {
        rowsToInsert.push([referenceDate, 'license_required_area', response[0], response[1], response[2], response[3]])
        dashboard.insert(writeSignUpConversionQuery, [rowsToInsert])
    });

    await getAmplitudeValue(licenseNotRequiredUrl, function(response) {
        rowsToInsert.push([referenceDate, 'license_not_required_area', response[0], response[1], null, response[2]])
        dashboard.insert(writeSignUpConversionQuery, [rowsToInsert])
    });
};

//specific TB
async function writeCoreUser() {
    const nextWeek = moment().add(7, 'days')
    const startYear = moment().year()
    const startWeek = moment().isoWeek().toString().padStart(2, '0')
    const endYear = nextWeek.year()
    const endWeek = nextWeek.isoWeek().toString().padStart(2, '0')
    const startYearWeek = Number(`${startYear}${startWeek}`)
    const endYearWeek = Number(`${endYear}${endWeek}`)

    const definition = 'ALL_12_WEEKS'
    const coreUserQuery = `
        SELECT use_user_id AS user_id,
            COUNT(DISTINCT YEARWEEK(use_start_at, 5)) AS active_yearweek_count
        FROM USE_TB
        WHERE use_user_id IN (
            SELECT use_user_id
            FROM USE_TB
            GROUP BY use_user_id
            HAVING MIN(use_start_at) <= CURDATE() - INTERVAL 12 WEEK
        )
        AND DATE(use_start_at) >= CURDATE() - INTERVAL 12 WEEK
        GROUP BY use_user_id
        HAVING active_yearweek_count >= 12`;
    const existingCoreUserQuery = `
        SELECT user_id
        FROM CORE_USER_TB
        WHERE core_period_end_week = YEARWEEK(CURDATE(), 5)`;

    let coreUser = await manual.selectPlural(coreUserQuery)
    let existingCoreUser = await dashboard.selectPlural(existingCoreUserQuery)
    let remainedCoreUser = []

    for (let i = 0; i < coreUser.length; i++) {
        for (let j = 0; j < existingCoreUser.length; j++) {
            if (coreUser[i]["user_id"] === existingCoreUser[j]["user_id"]) {
                coreUser.splice(i, 1)
                remainedCoreUser.push(existingCoreUser[j])
            };
        };
    };

    for (let i = 0; i < remainedCoreUser.length; i++) {
        await dashboard.update(updateCoreUserQuery, [endYearWeek, remainedCoreUser[i]["user_id"]])
    };
    
    for (let i = 0; i < coreUser.length; i++) {
        const rowsToInsert = []
        rowsToInsert.push([coreUser[i]["user_id"], definition, startYearWeek, endYearWeek])
        await dashboard.insert(writeCoreUserQuery, [rowsToInsert])
    };
};

async function writeCoreUserRetentionCohort() {
    const referenceDate = moment().format('YYYY-MM-DD')
    const typeName = 'core_all_12_weeks'
    const retainedUserQuery = `
        SET @WEEKS = ?;
        SELECT COUNT(*) AS value
        FROM CORE_USER_TB
        WHERE core_period_start_week = YEARWEEK(CURDATE() - INTERVAL @WEEKS WEEK, 5)   
        AND core_period_end_week = YEARWEEK(CURDATE() + INTERVAL 1 WEEK, 5)`;

    for (let weeksAgo = 0; weeksAgo < 9; weeksAgo++) {
        const rows = await dashboard.selectPlural(retainedUserQuery, [weeksAgo])
        const rowsToInsert = []
        const registeredDate = moment().subtract(weeksAgo * 7, 'day').format('YYYY-MM-DD')

        rowsToInsert.push([referenceDate, typeName, weeksAgo, registeredDate, rows[1][0]["value"]])
        await dashboard.insert(writeRetentionCohortQuery, [rowsToInsert])
    };
    
};

async function writeEarlyStageUserRetentionCohort() {
    const referenceDate = moment().format('YYYY-MM-DD')
    const typeName = 'early_stage'
    const retainedUserQuery = `
        SET @WEEKS = ?;
        SELECT COUNT(*) AS value
        FROM (
            SELECT UR.user_id
            FROM (
                SELECT user_id
                FROM USER_TB
                WHERE DATE(user_created_at) = CURDATE() - INTERVAL (@WEEKS * 7 + 1) DAY
                ) UR JOIN USE_TB U ON UR.user_id = U.use_user_id
            GROUP BY user_id
            HAVING DATE(MIN(U.use_start_at)) = CURDATE() - INTERVAL (@WEEKS * 7 + 1) DAY AND MAX(U.use_start_at) >= CURDATE() - INTERVAL 7 DAY
            ) RD`;
    
    for (let weeksAgo = 0; weeksAgo < 9; weeksAgo++) {
        const rows = await manual.selectPlural(retainedUserQuery, [weeksAgo])
        const rowsToInsert = []
        const registeredDate = moment().subtract(weeksAgo * 7 + 1, 'day').format('YYYY-MM-DD')

        rowsToInsert.push([referenceDate, typeName, weeksAgo, registeredDate, rows[1][0]["value"]])
        await dashboard.insert(writeRetentionCohortQuery, [rowsToInsert])
    };
};

async function writeCoreUserProportion() {
    const referenceDate = moment().format('YYYY-MM-DD')
    const typeName = 'core_all_12_weeks'
    const activeUserQuery = `
        SELECT COUNT(DISTINCT use_user_id) AS value
        FROM USE_TB U JOIN USER_TB UR ON U.use_user_id = UR.user_id
        WHERE DATE(U.use_start_at) BETWEEN CURDATE() - INTERVAL 42 DAY AND CURDATE() - INTERVAL 1 DAY
        AND UR.user_role = 'common' AND UR.user_deleted = 0`;
    const coreUserQuery = `
        SELECT COUNT(*) AS value
        FROM CORE_USER_TB
        WHERE core_period_end_week > YEARWEEK(CURDATE(), 5)`;
    const coreUserIntersectionQuery = `
        SELECT COUNT(*) AS value
        FROM CORE_USER_TB
        WHERE core_period_end_week > YEARWEEK(CURDATE(), 5) AND core_period_start_week < YEARWEEK(CURDATE(), 5)`;
    
    const activeUser = await manual.selectSingular(activeUserQuery)
    const coreUser = await dashboard.selectSingular(coreUserQuery)
    const coreUserIntersection = await dashboard.selectSingular(coreUserIntersectionQuery)

    const rowsToInsert = []
    rowsToInsert.push([referenceDate, typeName, activeUser["value"], coreUser["value"], coreUserIntersection["value"]])
    await dashboard.insert(writeUserProportionQuery, [rowsToInsert])
};

async function writeActiveUserProportion() {
    const referenceDate = moment().format('YYYY-MM-DD')
    const typeName = 'active'
    const totalUserQuery = `
        SELECT COUNT(DISTINCT use_user_id) AS value
        FROM USE_TB U JOIN USER_TB UR ON U.use_user_id = UR.user_id
        WHERE DATE(U.use_start_at) >= CURDATE() - INTERVAL 6 MONTH
        AND UR.user_role = 'common' AND UR.user_deleted = 0`;
    const activeUserQuery = `
        SELECT COUNT(DISTINCT use_user_id) AS value
        FROM USE_TB U JOIN USER_TB UR ON U.use_user_id = UR.user_id
        WHERE DATE(U.use_start_at) BETWEEN CURDATE() - INTERVAL 42 DAY AND CURDATE() - INTERVAL 1 DAY
        AND UR.user_role = 'common' AND UR.user_deleted = 0`;
    const activeUserIntersectionQuery = `
        SELECT COUNT(DISTINCT use_user_id) AS value
        FROM USE_TB U JOIN USER_TB UR ON U.use_user_id = UR.user_id
        WHERE DATE(U.use_start_at) BETWEEN CURDATE() - INTERVAL 42 DAY AND CURDATE() - INTERVAL 2 DAY
        AND UR.user_role = 'common' AND UR.user_deleted = 0`;
    
    const totalUser = await manual.selectSingular(totalUserQuery)
    const activeUser = await manual.selectSingular(activeUserQuery)
    const activeUserIntersection = await manual.selectSingular(activeUserIntersectionQuery)

    const rowsToInsert = []
    rowsToInsert.push([referenceDate, typeName, totalUser["value"], activeUser["value"], activeUserIntersection["value"]])
    await dashboard.insert(writeUserProportionQuery, [rowsToInsert])
};

async function writeCoreUserActivityRate() {
    const referenceDate = moment().format('YYYY-MM-DD')
    const referenceHour = moment().format('HH')
    const referenceMinute = moment().format('mm')

    const coreUserQuery = `
        SELECT user_id
        FROM CORE_USER_TB
        WHERE core_period_end_week = 0`;
    const activeCoreUserQuery = `
        SELECT COUNT(DISTINCT use_user_id) AS value
        FROM USE_TB
        WHERE use_user_id IN (?) AND DATE(use_start_at) = CURDATE()`;    

    const coreUser = await dashboard.selectPlural(coreUserQuery)

    let coreUserArray = []
    for (let i = 0; i < coreUser.length; i++) {
        coreUserArray.push(coreUser[i]["user_id"])
    }

    const rowsToInsert = []

    if (coreUserArray.length === 0) {
        rowsToInsert.push([referenceDate, referenceHour, referenceMinute, 0])
        await dashboard.insert(writeCoreUserActivityRateQuery, [rowsToInsert])
    } else {
        const activeCoreUser = await manual.selectPlural(activeCoreUserQuery, [coreUserArray])
        rowsToInsert.push([referenceDate, referenceHour, referenceMinute, activeCoreUser[0]["value"]])
        await dashboard.insert(writeCoreUserActivityRateQuery, [rowsToInsert])
    }
};

//query TB
async function writeRealTimeQueryResult() {
    const realTimeQueryIdsToCache = await dashboard.getRealTimeQueryIds()
    const referenceDate = moment().format('YYYY-MM-DD')
    const referenceHour = moment().format('HH')
    const referenceMinute = moment().format('mm')

    for (const queryId of realTimeQueryIdsToCache) {
        const queryString = await dashboard.getAndConvertRealTimeQueryOfId(queryId)
        const rows = await manual.selectPlural(queryString)
        const rowsToInsert = []

        for (const {value} of rows) {
            rowsToInsert.push([queryId, referenceDate, referenceHour, referenceMinute, value])
        };

        await dashboard.insert(writeRealTimeQueryResultQuery, [rowsToInsert])
    };
};

async function writeQueryResult() {
    const queryIdsToCache = await dashboard.getQueryIds()
    const referenceDate = moment().format('YYYY-MM-DD')

    for (const queryId of queryIdsToCache) {
        const queryString = await dashboard.getAndConvertQueryOfId(queryId)
        const rows = await manual.selectPlural(queryString)
        const rowsToInsert = []

        for (const {value} of rows) {
            rowsToInsert.push([queryId, referenceDate, value])
        };

        await dashboard.insert(writeQueryResultQuery, [rowsToInsert])
    };
};
