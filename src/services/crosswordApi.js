/**
 * Generates an intermediate-level crossword for any topic via Ollama (local).
 * Expects Ollama running at VITE_OLLAMA_BASE_URL (default http://localhost:11434)
 * and a model such as llama3.2 (VITE_OLLAMA_MODEL).
 */

const OLLAMA_BASE_URL =
  (typeof import.meta.env.VITE_OLLAMA_BASE_URL === 'string' && import.meta.env.VITE_OLLAMA_BASE_URL.trim()) ||
  'http://localhost:11434'
const OLLAMA_MODEL =
  (typeof import.meta.env.VITE_OLLAMA_MODEL === 'string' && import.meta.env.VITE_OLLAMA_MODEL.trim()) ||
  'llama3.2'

const OLLAMA_CHAT_URL = `${OLLAMA_BASE_URL.replace(/\/$/, '')}/api/chat`

function buildPrompt(topic) {
  return `You are a crossword puzzle designer. Generate an INTERMEDIATE-level crossword puzzle about the topic: "${topic}".

Rules:
- Grid must be 8x8 to 10x10. Use null for blocked (black) cells and a single uppercase letter (e.g. "A") for white cells.
- Include 4 to 8 words total (mix of across and down). Words must intersect correctly (shared cells must have the same letter).
- Clues should be intermediate: not trivial, not expert-only.
- Return ONLY valid JSON, no markdown or explanation.

JSON shape (use exactly these keys):
{
  "grid": [ ["R", "I", "V", "E", "R", null, null, null], ["A", null, ...], ... ],
  "clues": [
    { "num": 1, "direction": "across", "clue": "Natural flowing watercourse", "answer": "RIVER", "row": 0, "col": 0 },
    { "num": 2, "direction": "down", "clue": "Mountain chain", "answer": "RANGE", "row": 0, "col": 0 }
  ]
}

Requirements for clues: "num" is the clue number (1, 2, 3...). "direction" is exactly "across" or "down". "row" and "col" are 0-based starting position of the word. "answer" must match the letters in the grid along that row/col. Generate the crossword now.`
}

function validateAndNormalize(data) {
  if (!data || typeof data !== 'object') throw new Error('Invalid response shape')
  const grid = data.grid
  const clues = data.clues
  if (!Array.isArray(grid) || grid.length === 0 || !Array.isArray(grid[0])) throw new Error('Invalid grid')
  if (!Array.isArray(clues) || clues.length === 0) throw new Error('Invalid clues')

  const rows = grid.length
  const cols = grid[0].length
  const normalizedGrid = grid.map((row, r) => {
    if (!Array.isArray(row) || row.length !== cols) throw new Error('Invalid grid row')
    return row.map((cell, c) => {
      if (cell === null || cell === undefined) return null
      const letter = String(cell).trim().toUpperCase()
      if (letter.length !== 1 || !/^[A-Z]$/.test(letter)) return null
      return letter
    })
  })

  const normalizedClues = clues.map((cl, i) => {
    if (!cl || typeof cl !== 'object') throw new Error(`Invalid clue at index ${i}`)
    const num = Number(cl.num)
    const direction = String(cl.direction).toLowerCase() === 'down' ? 'down' : 'across'
    const clue = String(cl.clue ?? '').trim()
    const answer = String(cl.answer ?? '').trim().toUpperCase().replace(/\s+/g, '')
    const row = Number(cl.row)
    const col = Number(cl.col)
    if (!Number.isInteger(num) || num < 1 || !clue || !answer) throw new Error(`Invalid clue at index ${i}`)
    if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 || row >= rows || col >= cols) {
      throw new Error(`Invalid clue position at index ${i}`)
    }
    return { num, direction, clue, answer, row, col }
  })

  return { grid: normalizedGrid, clues: normalizedClues }
}

/**
 * @param {string} topic
 * @returns {Promise<{ grid: (string|null)[][], clues: { num: number, direction: 'across'|'down', clue: string, answer: string, row: number, col: number }[] }>}
 */
export async function generateCrossword(topic) {
  const trimmed = String(topic).trim()
  if (!trimmed) throw new Error('Topic is required')

  const response = await fetch(OLLAMA_CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [{ role: 'user', content: buildPrompt(trimmed) }],
      stream: false,
      format: 'json',
    }),
  })

  if (!response.ok) {
    const errBody = await response.text()
    let message = `Ollama error: ${response.status}`
    try {
      const j = JSON.parse(errBody)
      if (j.error) message = j.error
    } catch (_) {}
    throw new Error(message)
  }

  const json = await response.json()
  const content = json.message?.content
  if (!content) throw new Error('Empty response from Ollama')

  let data
  try {
    data = JSON.parse(content)
  } catch (_) {
    throw new Error('Invalid JSON from model')
  }

  return validateAndNormalize(data)
}
