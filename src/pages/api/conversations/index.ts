import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { askGPT } from '@/lib/gpt';

async function GET(req: NextApiRequest, res: NextApiResponse) {
  const userAuth = await getAuthUser(req);

  const conversations = await prisma.conversation
    .findMany({
      where: {
        userId: userAuth?.id,
      },
      include: {
        messages: {
          orderBy: {
            timestamp: 'asc',
          },
          take: 1,
          select: {
            content: true,
          },
        },
      },
    })
    .then((conversations) =>
      conversations.map((conversation) => ({
        ...conversation,
        firstMessage: conversation.messages[0]?.content,
      }))
    );

  res.status(200).json(conversations);
}

async function POST(req: NextApiRequest, res: NextApiResponse) {
  const timestamp = new Date();

  const userAuth = await getAuthUser(req);

  const { content } = req.body;

  const messageGPT = await askGPT([
    {
      content,
      role: 'user',
    },
  ]);

  const conversation = await prisma.conversation.create({
    data: {
      userId: userAuth?.id,
      messages: {
        create: [
          {
            content,
            role: 'user',
            timestamp,
          },
          messageGPT,
        ],
      },
    },
  });

  const conversationUpdated = {
    ...conversation,
    firstMessage: content,
  };

  res.status(200).json(conversationUpdated);
}

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res
      .status(405)
      .json({ error: 'method not allowed, please use GET or POST' });
    return;
  }

  if (req.method === 'GET') {
    await GET(req, res);
    return;
  }

  if (req.method === 'POST') {
    await POST(req, res);
    return;
  }
}
