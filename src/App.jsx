import { useState } from 'react'
import './App.css'

function App() {
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) setSubmitted(true)
  }

  if (submitted) {
    return (
      <main className="greeting-screen">
        <p className="greeting">Hellooo {name.trim()}</p>
      </main>
    )
  }

  return (
    <main className="name-prompt">
      <h1>What’s your name?</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Type your name..."
          autoFocus
          aria-label="Your name"
        />
        <button type="submit">Done</button>
      </form>
    </main>
  )
}

export default App
