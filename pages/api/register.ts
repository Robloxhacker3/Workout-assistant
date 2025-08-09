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
  if (!username || !password) return res.status(400).json({ error: 'username & password required' })
  const db = readDB()
  if (db.users.find((u:any)=>u.username===username)) return res.status(400).json({ error: 'username exists' })
  const hash = bcrypt.hashSync(password, 8)
  const user = { id: uuidv4(), username, passwordHash: hash, streak: 0, lastActive: null, points: 0, token: null }
  db.users.push(user)
  writeDB(db)
  res.json({ ok: true })
}
