import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

const DB = path.join(process.cwd(), 'db.json')
function readDB(){ return JSON.parse(fs.readFileSync(DB,'utf-8')) }

export default function handler(req: NextApiRequest, res: NextApiResponse){
  if (req.method !== 'GET') return res.status(405).end()
  const db = readDB()
  const top = db.users.map((u:any)=>({ username:u.username, streak:u.streak||0, points:u.points||0 }))
    .sort((a:any,b:any)=> b.streak - a.streak || b.points - a.points).slice(0,20)
  res.json({ leaderboard: top })
}
