import { useState } from 'react'
import { generateCrossword } from './services/crosswordApi'
import { Crossword } from './components/Crossword'
import './App.css'

function App() {
  const [topic, setTopic] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [crossword, setCrossword] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setCrossword(null)
    const trimmed = topic.trim()
    if (!trimmed) return
    setLoading(true)
    try {
      const puzzle = await generateCrossword(trimmed)
      setCrossword(puzzle)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate crossword. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleTryAgain = () => {
    setTopic('')
    setError(null)
    setCrossword(null)
  }

  if (crossword) {
    return (
      <main className="crossword-page">
        <header className="crossword-header">
          <h1>Crossword: {topic.trim()}</h1>
          <button type="button" onClick={handleTryAgain} className="btn-secondary">
            New topic
          </button>
        </header>
        <Crossword grid={crossword.grid} clues={crossword.clues} />
      </main>
    )
  }

  return (
    <main className="topic-prompt">
      <h1>Generate a crossword</h1>
      <p className="topic-hint">Enter any topic and we’ll generate an intermediate-level crossword.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={topic}
          onChange={(e) => {
            setTopic(e.target.value)
            setError(null)
          }}
          placeholder="e.g. space, cooking, history..."
          autoFocus
          aria-label="Topic"
          aria-invalid={!!error}
          aria-describedby={error ? 'topic-error' : undefined}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Generating…' : 'Generate'}
        </button>
      </form>
      {error && (
        <p id="topic-error" className="topic-error" role="alert">
          {error}
        </p>
      )}
    </main>
  )
}

export default App
