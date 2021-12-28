function getClock() {
    let now = new Date()
    var monthArray = new Array(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);

    const year = String(now.getFullYear());
    const month = String(monthArray[now.getMonth()]);
    const date = String(now.getDate());
    const hours = String(now.getHours());
    const minutes = String(now.getMinutes()).padStart(2, 0);

    return { year, month, date, hours, minutes }
}

export default getClock;