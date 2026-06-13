const { createHash, randomUUID } = require('crypto');
const { getFirestoreDb } = require('./firebaseAdmin');

const CONVERSATIONS = 'conversations';

function serializeValue(value) {
  if (value && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  return value ?? null;
}

function serializeDocument(document) {
  const data = document.data();
  return {
    id: document.id,
    ...data,
    createdAt: serializeValue(data.createdAt),
    updatedAt: serializeValue(data.updatedAt),
    lastMessageAt: serializeValue(data.lastMessageAt),
  };
}

function directConversationId(participantIds) {
  const directKey = [...participantIds].sort().join(':');
  return {
    directKey,
    id: `direct-${createHash('sha256').update(directKey).digest('hex').slice(0, 40)}`,
  };
}

async function getConversationForUser(conversationId, userId) {
  const db = getFirestoreDb();
  const document = await db.collection(CONVERSATIONS).doc(conversationId).get();

  if (!document.exists) {
    throw Object.assign(new Error('Conversation not found'), { statusCode: 404 });
  }

  const conversation = serializeDocument(document);
  if (!conversation.participantIds?.includes(userId)) {
    throw Object.assign(new Error('Conversation access denied'), { statusCode: 403 });
  }

  return conversation;
}

async function createDirectConversation(senderId, recipientId, productId = null) {
  const db = getFirestoreDb();
  const participantIds = [senderId, recipientId].sort();
  const direct = directConversationId(participantIds);
  const reference = db.collection(CONVERSATIONS).doc(direct.id);
  const existing = await reference.get();

    if (!existing.exists) {
    const now = new Date();
    await reference.set({
      type: 'DIRECT',
      directKey: direct.directKey,
      participantIds,
      productId: productId || null,
      createdBy: senderId,
      createdAt: now,
      updatedAt: now,
      lastMessageAt: null,
      lastMessagePreview: '',
      readAt: { [senderId]: now },
    });
  } else if (productId && !existing.data()?.productId) {
    await reference.update({ productId, updatedAt: new Date() });
  }

  return serializeDocument(await reference.get());
}

async function listConversations(userId) {
  const db = getFirestoreDb();
  const snapshot = await db
    .collection(CONVERSATIONS)
    .where('participantIds', 'array-contains', userId)
    .get();

  return snapshot.docs
    .map(serializeDocument)
    .sort((left, right) =>
      String(right.lastMessageAt || right.updatedAt).localeCompare(
        String(left.lastMessageAt || left.updatedAt),
      ),
    );
}

async function listMessages(conversationId, userId, limit = 100) {
  await getConversationForUser(conversationId, userId);
  const db = getFirestoreDb();
  const snapshot = await db
    .collection(CONVERSATIONS)
    .doc(conversationId)
    .collection('messages')
    .orderBy('createdAt', 'desc')
    .limit(Math.min(Math.max(Number(limit) || 100, 1), 100))
    .get();

  return snapshot.docs
    .map(serializeDocument)
    .reverse();
}

async function sendMessage(conversationId, senderId, content, clientMessageId) {
  const normalizedContent = String(content || '').trim();
  if (!normalizedContent || normalizedContent.length > 2000) {
    throw Object.assign(new Error('Message must contain 1 to 2000 characters'), {
      statusCode: 400,
    });
  }

  const conversation = await getConversationForUser(conversationId, senderId);
  const db = getFirestoreDb();
  const stableClientId = String(clientMessageId || randomUUID());
  const messageId = createHash('sha256')
    .update(`${senderId}:${stableClientId}`)
    .digest('hex');
  const conversationReference = db.collection(CONVERSATIONS).doc(conversationId);
  const messageReference = conversationReference.collection('messages').doc(messageId);
  const existing = await messageReference.get();

  if (!existing.exists) {
    const now = new Date();
    await db.runTransaction(async (transaction) => {
      transaction.set(messageReference, {
        conversationId,
        senderId,
        clientMessageId: stableClientId,
        content: normalizedContent,
        type: 'TEXT',
        createdAt: now,
      });
      transaction.update(conversationReference, {
        lastMessageAt: now,
        lastMessagePreview: normalizedContent.slice(0, 120),
        updatedAt: now,
        [`readAt.${senderId}`]: now,
      });
    });
  }

  return {
    message: serializeDocument(await messageReference.get()),
    participantIds: conversation.participantIds,
  };
}

async function markConversationRead(conversationId, userId) {
  await getConversationForUser(conversationId, userId);
  const db = getFirestoreDb();
  await db.collection(CONVERSATIONS).doc(conversationId).update({
    [`readAt.${userId}`]: new Date(),
  });
}

module.exports = {
  createDirectConversation,
  getConversationForUser,
  listConversations,
  listMessages,
  markConversationRead,
  sendMessage,
};
