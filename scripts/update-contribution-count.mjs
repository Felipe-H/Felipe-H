import { readFileSync, writeFileSync } from 'node:fs'

const owner = process.env.GITHUB_REPOSITORY_OWNER ?? 'Felipe-H'
const today = new Date()
const since = new Date(today)
since.setUTCDate(since.getUTCDate() - 365)

const from = since.toISOString().slice(0, 10)
const to = today.toISOString().slice(0, 10)
const calendarYear = since.getUTCFullYear()
const url = `https://github.com/users/${owner}/contributions?year=${calendarYear}`

const response = await fetch(url, {
  headers: { 'User-Agent': 'Felipe-H-profile-readme' },
})
if (!response.ok) throw new Error(`GitHub contributions respondeu HTTP ${response.status}`)

const html = await response.text()
const dayPattern =
  /<td[^>]*data-date="([^"]+)"[^>]*id="([^"]+)"[^>]*>[\s\S]*?<tool-tip[^>]*for="\2"[^>]*>([0-9,]+) contribution/i

let total = 0
let matchedDays = 0
for (const match of html.matchAll(new RegExp(dayPattern.source, 'gi'))) {
  const [, date, , count] = match
  if (date < from || date > to) continue
  total += Number(count.replaceAll(',', ''))
  matchedDays += 1
}

if (matchedDays === 0) throw new Error('Nenhum dia de contribuição foi encontrado no calendário do GitHub')

const formattedTotal = new Intl.NumberFormat('pt-BR').format(total)
const readmePath = new URL('../README.md', import.meta.url)
const readme = readFileSync(readmePath, 'utf8')
const marker = /<!-- contributions-last-year:start -->[\s\S]*?<!-- contributions-last-year:end -->/
const replacement = `<!-- contributions-last-year:start -->\n<p><strong>${formattedTotal} contribuições no último ano</strong></p>\n<!-- contributions-last-year:end -->`

if (!marker.test(readme)) throw new Error('Marcador de contribuições não encontrado no README.md')

const updated = readme.replace(marker, replacement)
if (updated === readme) {
  console.log(`Contribuições já atualizadas: ${formattedTotal}`)
} else {
  writeFileSync(readmePath, updated)
  console.log(`README.md atualizado: ${formattedTotal} contribuições entre ${from} e ${to}`)
}
