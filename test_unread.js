
const ChatService = require('./src/services/ChatService');

async function test() {
  try {
    console.log('--- TEST UNREAD MESSAGES ---');
    
    // Check initial unread for admin
    const initialUnread = await ChatService.getTotalUnreadForUser(12, 'admin');
    console.log('Total unread (admin) initially:', initialUnread);

    // Count unread for proposal 6 specifically
    const unreadP6 = await ChatService.countUnread(6, 'client');
    console.log('Unread messages for proposal 6 from client:', unreadP6);

    console.log('Calling ChatService.markAsRead(6, "commercial")...');
    await ChatService.markAsRead(6, 'commercial');

    // Check after marking as read
    const afterUnread = await ChatService.getTotalUnreadForUser(12, 'admin');
    console.log('Total unread (admin) after markAsRead:', afterUnread);

    const unreadP6After = await ChatService.countUnread(6, 'client');
    console.log('Unread messages for proposal 6 from client after:', unreadP6After);

    if (afterUnread === initialUnread - unreadP6) {
        console.log('SUCCESS: Count is consistent.');
    } else {
        console.log('NOTE: Count changed from', initialUnread, 'to', afterUnread, '(Difference:', initialUnread - afterUnread, ')');
    }

    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

test();
