import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = sevenDaysAgo.toISOString();
    
    // Get all ephemeral messages older than 7 days
    const allMessages = await base44.asServiceRole.entities.Message.filter({
      is_ephemeral: true
    });
    
    const expiredMessages = allMessages.filter(msg => 
      msg.ephemeral_expires_at && msg.ephemeral_expires_at < cutoffDate
    );
    
    const deletedCount = { total: 0, byConversation: {} };
    
    // Group by conversation
    for (const msg of expiredMessages) {
      if (!deletedCount.byConversation[msg.conversation_id]) {
        deletedCount.byConversation[msg.conversation_id] = 0;
      }
      
      await base44.asServiceRole.entities.Message.delete(msg.id);
      deletedCount.byConversation[msg.conversation_id]++;
      deletedCount.total++;
    }
    
    // Create system messages for conversations with deleted messages
    for (const [conversationId, count] of Object.entries(deletedCount.byConversation)) {
      await base44.asServiceRole.entities.Message.create({
        conversation_id: conversationId,
        sender_email: 'system@iwhome.it',
        content: `${count} messaggi effimeri sono stati eliminati automaticamente dopo 7 giorni.`,
        message_type: 'system'
      });
    }
    
    return Response.json({
      success: true,
      deleted: deletedCount.total,
      conversations: Object.keys(deletedCount.byConversation).length,
      details: deletedCount.byConversation
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});