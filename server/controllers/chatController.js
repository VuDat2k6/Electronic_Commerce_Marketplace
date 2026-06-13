const prisma = require('../utils/db');
const chatService = require('../services/chatService');

function sendError(res, error) {
  const status = error.statusCode || 500;
  res.status(status).json({ error: status === 500 ? 'Unable to process chat request' : error.message });
}

async function enrichConversations(conversations, currentUserId) {
  const participantIds = [
    ...new Set(conversations.flatMap((conversation) => conversation.participantIds || [])),
  ];
  const users = await prisma.user.findMany({
    where: { id: { in: participantIds } },
    select: { id: true, name: true, image: true, shopName: true },
  });
  const userMap = new Map(users.map((user) => [user.id, user]));

  return conversations.map((conversation) => ({
    ...conversation,
    participants: conversation.participantIds.map((id) => userMap.get(id)).filter(Boolean),
    counterpart: userMap.get(conversation.participantIds.find((id) => id !== currentUserId)),
  }));
}

exports.listConversations = async (req, res) => {
  try {
    const conversations = await chatService.listConversations(req.user.id);
    res.json({ conversations: await enrichConversations(conversations, req.user.id) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createConversation = async (req, res) => {
  try {
    const recipientId = String(req.body.recipientId || '').trim();
    if (!recipientId || recipientId === req.user.id) {
      return res.status(400).json({ error: 'A different recipient is required' });
    }

    const productId = String(req.body.productId || '').trim();
    if (!productId) return res.status(400).json({ error: 'A product is required to contact a seller' });

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId: recipientId,
        status: 'PUBLISHED',
        seller: { is: { role: 'seller', shopStatus: 'ACTIVE' } },
      },
      select: { id: true, sellerId: true },
    });
    if (!product) return res.status(404).json({ error: 'Active seller product not found' });

    const conversation = await chatService.createDirectConversation(
      req.user.id,
      recipientId,
      product.id,
    );
    const [enriched] = await enrichConversations([conversation], req.user.id);
    res.status(201).json({ conversation: enriched });
  } catch (error) {
    sendError(res, error);
  }
};

exports.listMessages = async (req, res) => {
  try {
    const messages = await chatService.listMessages(
      req.params.conversationId,
      req.user.id,
      req.query.limit,
    );
    res.json({ messages });
  } catch (error) {
    sendError(res, error);
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const result = await chatService.sendMessage(
      req.params.conversationId,
      req.user.id,
      req.body.content,
      req.body.clientMessageId,
    );
    res.status(201).json({ message: result.message });
  } catch (error) {
    sendError(res, error);
  }
};

exports.markRead = async (req, res) => {
  try {
    await chatService.markConversationRead(req.params.conversationId, req.user.id);
    res.status(204).end();
  } catch (error) {
    sendError(res, error);
  }
};
