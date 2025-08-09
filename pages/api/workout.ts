import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const DB = path.join(process.cwd(), 'db.json')
function readDB(){ return JSON.parse(fs.readFileSync(DB,'utf-8')) }
function writeDB(db:any){ fs.writeFileSync(DB, JSON.stringify(db,null,2)) }

function auth(req: NextApiRequest){
  const token = req.headers['x-auth-token'] as string || req.body.token
  if (!token) return null
  const db = readDB()
  return db.users.find((u:any)=>u.token===token) || null
}

export default function handler(req: NextApiRequest, res: NextApiResponse){
  if (req.method !== 'POST') return res.status(405).end()
  const user = auth(req)
  if (!user) return res.status(401).json({ error: 'unauthorized' })
  const db = readDB()
  const today = new Date().toISOString().slice(0,10)
  const last = user.lastActive ? user.lastActive.slice(0,10) : null
  const yesterday = new Date(Date.now() - 24*60*60*1000).toISOString().slice(0,10)
  if (last === today) {
    return res.json({ ok: true, message: 'already logged today', streak: user.streak })
  } else if (last === yesterday) {
    user.streak = (user.streak || 0) + 1
  } else {
    user.streak = 1
  }
  user.lastActive = new Date().toISOString()
  user.points = (user.points || 0) + 10
  db.workouts.push({ id: uuidv4(), userId: user.id, date: new Date().toISOString() })
  writeDB(db)
  res.json({ ok: true, streak: user.streak, points: user.points })
}
