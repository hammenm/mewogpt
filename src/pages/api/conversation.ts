import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
import { askGPT } from '@/lib/gpt';
import { getAuthUser } from '@/lib/auth';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed, please use POST' });
    return;
  }

  const { content } = req.body;
  const timestamp = new Date();

  const messageGPT = await askGPT([
    {
      role: 'user',
      content,
    },
  ]);

  const user = await getAuthUser(req);
  const userId = user ? user.id : null;

  const conversation = await prisma.conversation.create({
    data: {
      messages: {
        create: [
          {
            role: 'user',
            content,
            timestamp,
          },
          messageGPT,
        ],
      },
      userId,
    },
    include: {
      messages: {
        select: {
          id: true,
          content: true,
          role: true,
          timestamp: true,
        },
      },
    },
  });

  res.status(200).json(conversation);
}