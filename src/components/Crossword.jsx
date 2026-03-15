import { useState, useCallback } from 'react'

function getClueNumberAt(clues, row, col) {
  const c = clues.find((cl) => cl.row === row && cl.col === col)
  return c ? c.num : null
}

export function Crossword({ grid, clues }) {
  const rows = grid.length
  const cols = grid[0]?.length ?? 0

  const [entries, setEntries] = useState(() =>
    grid.map((row) => row.map((cell) => (cell ? '' : null)))
  )

  const handleCellChange = useCallback(
    (r, c, value) => {
      const upper = value.slice(-1).toUpperCase()
      if (upper && !/^[A-Z]$/.test(upper)) return
      setEntries((prev) => {
        const next = prev.map((row, ri) =>
          row.map((cell, ci) => (ri === r && ci === c ? (upper || '') : cell))
        )
        return next
      })
    },
    []
  )

  const handleKeyDown = useCallback(
    (e, r, c) => {
      if (e.key === 'Backspace' && !entries[r][c]) {
        e.preventDefault()
        // move to previous cell
        if (c > 0 && grid[r][c - 1]) {
          const prev = document.querySelector(
            `input[data-row="${r}"][data-col="${c - 1}"]`
          )
          prev?.focus()
        } else if (r > 0) {
          for (let j = cols - 1; j >= 0; j--) {
            if (grid[r - 1][j]) {
              document
                .querySelector(`input[data-row="${r - 1}"][data-col="${j}"]`)
                ?.focus()
              break
            }
          }
        }
      }
    },
    [entries, grid, cols]
  )

  const acrossClues = clues.filter((c) => c.direction === 'across')
  const downClues = clues.filter((c) => c.direction === 'down')

  return (
    <div className="crossword-wrap">
      <div className="crossword-grid-wrap">
        <div
          className="crossword-grid"
          style={{
            '--rows': rows,
            '--cols': cols,
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isBlock = cell === null
              const num = getClueNumberAt(clues, r, c)
              if (isBlock) {
                return <div key={`${r}-${c}`} className="crossword-cell block" />
              }
              return (
                <div key={`${r}-${c}`} className="crossword-cell letter">
                  {num != null && <span className="cell-num">{num}</span>}
                  <input
                    type="text"
                    maxLength={1}
                    value={entries[r][c] ?? ''}
                    onChange={(e) => handleCellChange(r, c, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, r, c)}
                    data-row={r}
                    data-col={c}
                    aria-label={`Row ${r + 1}, column ${c + 1}`}
                  />
                </div>
              )
            })
          )}
        </div>
      </div>
      <div className="crossword-clues">
        <section className="clue-list">
          <h3>Across</h3>
          <ul>
            {acrossClues.map((cl) => (
              <li key={`a-${cl.num}`}>
                <strong>{cl.num}.</strong> {cl.clue}
              </li>
            ))}
          </ul>
        </section>
        <section className="clue-list">
          <h3>Down</h3>
          <ul>
            {downClues.map((cl) => (
              <li key={`d-${cl.num}`}>
                <strong>{cl.num}.</strong> {cl.clue}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
