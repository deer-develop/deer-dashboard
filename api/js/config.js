const analysis = {
    host: 'deer-manual-analysis-db.cu38cjd0snta.ap-northeast-2.rds.amazonaws.com',
    user: 'dataviewer',
    password: 'doyoung',
    port: 3306,
    database: 'DEER'
};

const storage = {
    host: 'deer-dashboard-storage-2.cu38cjd0snta.ap-northeast-2.rds.amazonaws.com',
    user: 'DeerDashboard',
    password: 'Dashboard1101!',
    port: 3306,
    database: 'Dashboard'
};

const amplitude = {
    apiKey: 'c97d886c9c4dba491ae0a93bc601241f',
    secretKey: 'e021ec65b5e1e6745eccdd8e08acc22d'
}

const google = {
    sheetID: '1MDnZgyVyeGchJiMUI2UW5DwOtWBiulpgHw_PYUHbeGQ'
}

module.exports = {
    analysis,
    storage,
    amplitude,
    google
};