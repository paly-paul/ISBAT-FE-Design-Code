// Semester names come back spelled out ("Year One - Semester Two") — shown
// as numbers instead ("Year 1 · Semester 2"). Anything that doesn't match
// that shape is returned unchanged.
const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
}

function toNumber(word: string): number | null {
  if (/^\d+$/.test(word)) return Number(word)
  return NUMBER_WORDS[word.toLowerCase()] ?? null
}

export function semesterLabel(name: string | null | undefined): string | null {
  if (!name) return null
  const year = name.match(/year\s+(\w+)/i)
  const sem = name.match(/sem(?:ester)?\s+(\w+)/i)
  const y = year ? toNumber(year[1]) : null
  const s = sem ? toNumber(sem[1]) : null
  if (y == null && s == null) return name
  return [y != null && `Year ${y}`, s != null && `Semester ${s}`].filter(Boolean).join(' · ')
}
