import { useEffect, useState } from 'react'

type User = { id: string; username: string; streak?: number; points?: number }

export default function Home() {
  const [token, setToken] = useState<string | null>(typeof window !== 'undefined' ? localStorage.getItem('token') : null)
  const [user, setUser] = useState<User | null>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [assistantLog, setAssistantLog] = useState<string[]>([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const u = localStorage.getItem('username')
    if (u) setUser({ id: 'me', username: u })
    loadLeaderboard()
  }, [])

  async function loadLeaderboard() {
    const r = await fetch('/api/leaderboard')
    const j = await r.json()
    setLeaderboard(j.leaderboard || [])
  }

  async function register(username: string, password: string) {
    const r = await fetch('/api/register', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ username, password })})
    const j = await r.json()
    if (!r.ok) return alert(j.error || 'error')
    alert('Registered! You can now login.')
  }

  async function login(username: string, password: string) {
    const r = await fetch('/api/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ username, password })})
    const j = await r.json()
    if (!r.ok) return alert(j.error || 'login failed')
    localStorage.setItem('token', j.token)
    localStorage.setItem('username', j.user.username)
    setToken(j.token)
    setUser(j.user)
    loadLeaderboard()
  }

  async function logWorkout() {
    if (!token) return alert('login required')
    const r = await fetch('/api/workout', { method: 'POST', headers: {'Content-Type':'application/json','x-auth-token': token}, body: JSON.stringify({})})
    const j = await r.json()
    if (!r.ok) return alert(j.error || 'error')
    setUser((prev) => prev ? { ...prev, streak: j.streak, points: j.points } : prev)
    loadLeaderboard()
  }

  async function askAssistant() {
    if (!token) return alert('login required')
    setAssistantLog(prev => [...prev, 'You: ' + msg])
    const r = await fetch('/api/assistant', { method: 'POST', headers: {'Content-Type':'application/json','x-auth-token': token}, body: JSON.stringify({ message: msg })})
    const j = await r.json()
    if (!r.ok) return alert(j.error || 'assistant error')
    setAssistantLog(prev => [...prev, 'Assistant: ' + j.reply])
    setMsg('')
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">Workout GPT (Next)</div>
        <div>
          {user ? <span style={{marginRight:12}}>Hi {user.username}</span> : null}
          {user ? <button className="btn" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('username'); setToken(null); setUser(null); }}>Logout</button> : null}
        </div>
      </header>

      <main className="main">
        {!user ? (
          <AuthForms onRegister={register} onLogin={login} />
        ) : (
          <div className="card">
            <h3>Welcome, {user.username}</h3>
            <p>Streak: {user.streak || 0}</p>
            <p>Points: {user.points || 0}</p>
            <button className="btn" onClick={logWorkout}>Log Workout</button>
          </div>
        )}

        <div className="card">
          <h3>Leaderboard</h3>
          <div className="leaderboard">
            {leaderboard.map((r, i) => <div key={i} className="leader-row">{i+1}. {r.username} — streak: {r.streak} — pts: {r.points}</div>)}
          </div>
        </div>

        <div className="card">
          <h3>AI Assistant</h3>
          <div className="assistant-log">
            {assistantLog.map((l, i) => <div key={i} className={l.startsWith('You:') ? 'assistant-user' : 'assistant-bot'}>{l}</div>)}
          </div>
          <div style={{marginTop:8}}>
            <input className="input" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Ask for routines, tips, meal suggestions..." />
            <button className="btn" onClick={askAssistant}>Ask</button>
          </div>
        </div>

        <div className="card">
          <h3>Tutorial</h3>
          <ol>
            <li>Register and login.</li>
            <li>Press "Log Workout" each day to build streaks.</li>
            <li>Use the AI assistant to get routines and tracking tips.</li>
            <li>Leaderboard shows top users by streak & points.</li>
          </ol>
        </div>
      </main>
    </div>
  )
}

function AuthForms({ onRegister, onLogin }: any) {
  const [u, setU] = useState(''),
        [p, setP] = useState('')

  return (
    <div className="card">
      <h3>Login / Register</h3>
      <input className="input" placeholder="username" value={u} onChange={(e)=>setU(e.target.value)} />
      <input className="input" placeholder="password" type="password" value={p} onChange={(e)=>setP(e.target.value)} />
      <div style={{display:'flex',gap:8}}>
        <button className="btn" onClick={()=>onLogin(u,p)}>Login</button>
        <button className="btn" onClick={()=>onRegister(u,p)}>Register</button>
      </div>
    </div>
  )
}
