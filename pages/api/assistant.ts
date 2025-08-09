import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'

const DB = path.join(process.cwd(), 'db.json')
function readDB(){ return JSON.parse(fs.readFileSync(DB,'utf-8')) }

function auth(req: NextApiRequest){
  const token = req.headers['x-auth-token'] as string || req.body.token
  if (!token) return null
  const db = readDB()
  return db.users.find((u:any)=>u.token===token) || null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if (req.method !== 'POST') return res.status(405).end()
  const user = auth(req)
  if (!user) return res.status(401).json({ error: 'unauthorized' })
  const { message } = req.body
  if (!message) return res.status(400).json({ error: 'message required' })

  const OPENAI_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_KEY) return res.status(500).json({ error: 'OpenAI API key not configured. Set OPENAI_API_KEY in env.' })

  try {
    const payload = {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a friendly workout assistant. Give routines, progress plans, tips, and concise steps.' },
        { role: 'user', content: message }
      ],
      max_tokens: 800
    }

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + OPENAI_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!r.ok) {
      const txt = await r.text()
      return res.status(502).json({ error: 'OpenAI error', detail: txt })
    }
    const json = await r.json()
    const reply = (json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content) || JSON.stringify(json)
    res.json({ reply })
  } catch (err:any) {
    res.status(500).json({ error: 'assistant error', detail: String(err) })
  }
}
