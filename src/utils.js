export function toBirthdayDate(rawDate) {
    if (!rawDate) {
        return null
    }

    const date = new Date(`${rawDate}T12:00:00`)
    return Number.isNaN(date.getTime()) ? null : date
}

export function doFormattingOfBirthday(dateInput, noYear = false) {
    if (!dateInput) return '--/--/----'

    // If the value wasn't parsed, try to reformat known string patterns into dd/mm/yyyy
    if (typeof dateInput === 'string') {
        // yyyy-mm-dd -> dd/mm/yyyy
        const ymd = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/)
        if (ymd) return `${ymd[3]}/${ymd[2]}/${ymd[1]}`

        // dd/mm/yyyy -> dd/mm/yyyy (already desired)
        const dmy = dateInput.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
        if (dmy) return `${dmy[1]}/${dmy[2]}/${dmy[3]}`
    }

    const d = dateInput
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    if (noYear) {
        return `${day}/${month}`
    }
    return `${day}/${month}/${year}`
}