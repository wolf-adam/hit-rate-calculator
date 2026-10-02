import { Currency } from "../data/storage"

export const formatNumber = (value: number): string => {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export const formatPrice = (
  value: number,
  currency: Currency,
  rate: number,
): string => {
  const convertedValue = currency === 'HUF' ? Math.round(value * rate) : value
  return `${formatNumber(convertedValue)} ${currency === 'HUF' ? 'Ft' : '€'}`
}

export const formatBiggestHitLink = (url: string | null): string => {
  if (!url) return ''
  const path = url.split(/[?#]/, 1)[0]
  const lastSegment = path.split(/[\\/]/).pop() ?? url
  const decodedName = decodeURIComponent(lastSegment)
    .replace(/-V\d+(?=-|$)/i, '')
    .trim()
  const extendedCodeMatch = decodedName.match(
    /^(.+?)-(\d+[A-Za-z])([A-Za-z]*?)-?(\d{1,3})$/,
  )

  if (extendedCodeMatch) {
    const [
      , name, codePrefix, codeSuffix, codeDigits,
    ] = extendedCodeMatch
    const code = codeSuffix
      ? `${codePrefix} ${codeSuffix}`
      : codePrefix
    if (name.toLowerCase().endsWith('-legend')) {
      return `${name.replace(/-/g, ' ')} ${codePrefix}${codeSuffix} ${codeDigits}`
    }
    return `${name.replace(/-/g, ' ').trim()} (${code} ${codeDigits})`
  }

  const normalizedName = decodedName.replace(/-/g, ' ')
  const codeMatch = normalizedName.match(/^(.*?)-?([A-Za-z]+)(\d{3})$/)

  if (!codeMatch) return normalizedName

  const [, name, codeLetters, codeDigits] = codeMatch
  return `${name.trim()} (${codeLetters} ${codeDigits})`
}

export const getPkmnCardsSearchUrl = (cardmarketUrl: string): string => {
  const path = cardmarketUrl.split(/[?#]/, 1)[0]
  const lastSegment = path.split(/[\\/]/).pop() ?? ''
  const decodedName = decodeURIComponent(lastSegment).trim()
  const versionMatch = decodedName.match(/^(.+?)-V\d+(?:-|$)/i)
  const nameBeforeVersion = versionMatch?.[1] ?? decodedName
  const nameWithoutEdition = nameBeforeVersion.replace(
    /\s+LV\.X\s*\([^)]*\)\s*$/i,
    '',
  )
  const nameWithoutCode = nameWithoutEdition.replace(
    /-(?:\d+[A-Za-z]+\d{1,3}|\d+[A-Za-z]+-\d{1,3}|[A-Za-z]+\d{3})$/,
    '',
  )
  const searchName = nameWithoutCode.replace(/-/g, ' ').trim()

  return `https://pkmncards.com/?s=${encodeURIComponent(searchName)}`
}