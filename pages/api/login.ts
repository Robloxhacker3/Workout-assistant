import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const DB = path.join(process.cwd(), 'db.json')
function readDB(){ return JSON.parse(fs.readFileSync(DB,'utf-8')) }
function writeDB(db:any){ fs.writeFileSync(DB, JSON.stringify(db,null,2)) }

export default function handler(req: NextApiRequest, res: NextApiResponse){
  if (req.method !== 'POST') return res.status(405).end()
  const { username, password } = req.body
  const db = readDB()
  const user = db.users.find((u:any)=>u.username===username)
  if (!user) return res.status(400).json({ error: 'invalid credentials' })
  const ok = bcrypt.compareSync(password, user.passwordHash)
  if (!ok) return res.status(400).json({ error: 'invalid credentials' })
  const token = uuidv4()
  user.token = token
  writeDB(db)
  res.json({ token, user: { id: user.id, username: user.username, streak: user.streak, points: user.points } })
}
