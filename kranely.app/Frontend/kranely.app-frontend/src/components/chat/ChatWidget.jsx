import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && !conversation) {
      initConversation();
    }
  }, [isOpen]);

  useEffect(() => {
    if (conversation) {
      const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
        setMessages(data.messages || []);
      });
      return () => unsubscribe();
    }
  }, [conversation]);

  const initConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: 'assistente_Kranely',
      metadata: { name: 'Chat Web' }
    });
    setConversation(conv);
    setMessages(conv.messages || []);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !conversation || loading) return;

    const userMessage = inputValue;
    setInputValue('');
    setLoading(true);

    await base44.agents.addMessage(conversation, {
      role: 'user',
      content: userMessage
    });

    setLoading(false);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] bg-gradient-to-br from-[#495057] to-[#6c757d] backdrop-blur-sm border border-[#f8f9fa]/20 rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#343a40] to-[#495057] p-4 flex items-center justify-between border-b border-[#f8f9fa]/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] flex items-center justify-center shadow-lg">
                  <MessageCircle size={20} className="text-[#212529]" />
                </div>
                <div>
                  <h3 className="font-medium text-[#f8f9fa]">Assistente Kranely</h3>
                  <p className="text-xs text-[#dee2e6]">Online</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#dee2e6] hover:text-[#f8f9fa] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-[#dee2e6] text-sm mt-8">
                  <p>Ciao! 👋</p>
                  <p className="mt-2">Come posso aiutarti con il tuo progetto?</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-lg ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529]'
                        : 'bg-[#343a40]/50 backdrop-blur-sm border border-[#f8f9fa]/10 text-[#f8f9fa]'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#343a40]/50 backdrop-blur-sm border border-[#f8f9fa]/10 rounded-2xl px-4 py-2 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-[#f8f9fa]" />
                    <span className="text-sm text-[#dee2e6]">Sto scrivendo...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[#f8f9fa]/10">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Scrivi un messaggio..."
                  className="rounded-full bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] placeholder:text-[#adb5bd] focus:border-[#f8f9fa] focus:ring-[#f8f9fa]"
                  disabled={loading}
                />
                <Button
                  onClick={handleSend}
                  disabled={loading || !inputValue.trim()}
                  className="bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] hover:shadow-2xl rounded-full px-4 font-medium"
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] rounded-full shadow-2xl flex items-center justify-center z-50"
      >
        <MessageCircle size={28} className="text-[#212529]" />
      </motion.button>
    </>
  );
}
