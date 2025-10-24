export function getDayOfWeek(dayOfWeek) {
    switch (dayOfWeek) {
      case 0:
        return "вс";
      case 1:
        return "пн";
      case 2:
        return "вт";
      case 3:
        return "ср";
      case 4:
        return "чт";
      case 5:
        return "пт";
      case 6:
        return "сб";
      default:
        return "Invalid date";
        }
      }
  
export function IncrementDate(minus_day, date = null) {
    let today = date ? new Date(date) : new Date();
    let newDate = new Date(today.getTime() - (minus_day * 24 * 60 * 60 * 1000));
    let day = String(newDate.getDate()).padStart(2, '0');
    let month = String(newDate.getMonth() + 1).padStart(2, '0');
    let year = newDate.getFullYear();

    return {dateObj: newDate, dateStr: `${year}-${month}-${day}`}
}
  
export function getFormattedDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return {
        day: day,
        month: month,
        year: year,
        weekday: getDayOfWeek(date.getDay())
    }
}
  
export function calculateDays(start_date, end_date) {
    var diffTime = Math.abs(end_date - start_date);
    var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}