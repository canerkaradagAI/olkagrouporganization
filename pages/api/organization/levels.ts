import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const levels = await prisma.jobTitleLevel.findMany({
      select: { levelName: true, color: true, levelOrder: true },
      orderBy: { levelOrder: 'asc' },
    })

    res.status(200).json(levels)
  } catch (error) {
    console.error('API Error:', error)
    res.status(200).json([])
  }
}


