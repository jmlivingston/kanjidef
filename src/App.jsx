import { useEffect, useMemo, useState } from 'react'
import kanjiData from './data/kanji.json'
import './App.css'

function formatKanjiLine(entry) {
  const onValues = entry.on.join(',')
  const kunValues = entry.kun.join(',')
  const nanoriValues = (entry.nanori ?? []).join(',')
  const meanings = entry.meanings.join(', ')
  const nanoriSegment = nanoriValues ? ` (名:${nanoriValues})` : ''
  const readingSegment = [
    onValues ? `「${onValues}」` : '',
    kunValues || '',
  ].join('')
  const meaningSeparator = onValues && kunValues ? ' - ' : '- '

  return `${entry.literal}${readingSegment}${meaningSeparator}${meanings}${nanoriSegment}`
}

function App() {
  const [query, setQuery] = useState('')
  const [copiedLiteral, setCopiedLiteral] = useState('')
  const [searchByKanji, setSearchByKanji] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(true)

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  const results = useMemo(() => {
    const term = query.trim()
    if (!term) {
      return []
    }

    const normalizedTerm = term.toLowerCase()

    return kanjiData.data.filter((entry) => {
      if (searchByKanji) {
        return entry.literal.includes(term)
      }

      const searchableValues = [
        entry.literal,
        ...entry.on,
        ...entry.kun,
        ...(entry.nanori ?? []),
        ...entry.meanings,
      ]
      return searchableValues.some((value) => String(value).toLowerCase().includes(normalizedTerm))
    })
  }, [query, searchByKanji])

  const handleCopy = async (entry) => {
    const text = formatKanjiLine(entry)
    await navigator.clipboard.writeText(text)
    setCopiedLiteral(entry.literal)
  }

  return (
    <main className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h1 className="mb-0">Kanji Search (Top {kanjiData.meta.count.toLocaleString('en-US')})</h1>
            <div className="form-check form-switch mb-0 ms-3">
              <input
                id="darkModeToggle"
                type="checkbox"
                checked={isDarkMode}
                onChange={(event) => setIsDarkMode(event.target.checked)}
                className="form-check-input"
              />
              <label htmlFor="darkModeToggle" className="form-check-label">
                Dark Mode
              </label>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3 mb-3">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search..."
              aria-label="Search"
              className="form-control fs-4 mb-0"
            />

            <div className="form-check mb-0 text-nowrap">
              <input
                id="searchByKanji"
                type="checkbox"
                checked={searchByKanji}
                onChange={(event) => setSearchByKanji(event.target.checked)}
                className="form-check-input"
              />
              <label htmlFor="searchByKanji" className="form-check-label">
                By Kanji
              </label>
            </div>
          </div>

          {query.trim() && results.length === 0 && <p className="text-muted">No matches found.</p>}

          {results.length > 0 && (
            <ul className="list-group">
              {results.map((entry) => (
                <li
                  key={entry.literal}
                  className="list-group-item d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2"
                >
                  <span className="flex-grow-1 result-line fs-4">{formatKanjiLine(entry)}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(entry)}
                    className="btn btn-outline-secondary btn-sm"
                  >
                    {copiedLiteral === entry.literal ? 'Copied' : 'Copy'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}

export default App
