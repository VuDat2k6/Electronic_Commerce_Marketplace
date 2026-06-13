const express = require('express');
const { authenticate } = require('../middleware/auth');
const controller = require('../controllers/chatController');

const router = express.Router();

router.use(authenticate);
router.get('/conversations', controller.listConversations);
router.post('/conversations', controller.createConversation);
router.get('/conversations/:conversationId/messages', controller.listMessages);
router.post('/conversations/:conversationId/messages', controller.sendMessage);
router.patch('/conversations/:conversationId/read', controller.markRead);

module.exports = router;
