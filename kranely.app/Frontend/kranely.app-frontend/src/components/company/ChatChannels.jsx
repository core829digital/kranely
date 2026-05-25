import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../Backend/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, Send, Paperclip, Hash, Users, Building } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function ChatChannels({ user }) {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [message, setMessage] = useState('');
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newChannelData, setNewChannelData] = useState({
    name: '',
    type: 'generale',
    linked_id: ''
  });
  const messagesEndRef = useRef(null);

  const channels = useQuery(api.chat.listChannels, { company_email: user?.email }) || [];

  // Reuse cantieri/teams queries or create specific ones?
  // We already have api.cantieri.listTeams and listCantieri.
  const teams = useQuery(api.cantieri.listTeams, { company_email: user?.email }) || [];
  const cantieri = useQuery(api.cantieri.listCantieri, { company_email: user?.email }) || [];

  const messages = useQuery(api.chat.listMessages,
    selectedChannel ? { channel_id: selectedChannel._id } : "skip"
  ) || [];

  const createChannel = useMutation(api.chat.createChannel);
  const sendMessage = useMutation(api.chat.sendMessage);
  // File upload logic?
  // Convex has storage, but user prompts didn't explicitly ask for file storage migration, 
  // and base44.integrations.Core.UploadFile was used.
  // I will comment out file upload or leave it as a TODO since I don't have a storage solution set up in the prompt plan.
  // Or I can just mock it/remove it.
  // The prompt said "Extract logic... replace Base44 hooks...".
  // "base44.integrations.Core.UploadFile" is an integration call.
  // I will leave it mocked to avoid breaking valid code, but warn.

  const handleCreateChannel = async () => {
    await createChannel({
      ...newChannelData,
      company_email: user.email,
      members: [user.email]
    });
    setShowNewChannel(false);
    setNewChannelData({ name: '', type: 'generale', linked_id: '' });
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    await sendMessage({
      channel_id: selectedChannel._id,
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      content: message
    });
    setMessage('');
  };

  const handleFileUpload = async (e) => {
    // TODO: Implement file upload with Convex Storage or other service
    console.warn("File upload not implemented in migration");
    /*
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    // const { file_url } = await ...
    
    // sendMessage({ ... with attachments })
    setUploadingFile(false);
    */
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="grid grid-cols-12 gap-3 sm:gap-4 h-[calc(100vh-300px)] sm:h-[500px] lg:h-[600px]">
      {/* Channels List */}
      <div className="col-span-12 lg:col-span-3 space-y-2 overflow-y-auto max-h-full">
        <Button
          onClick={() => setShowNewChannel(true)}
          className="w-full bg-gradient-to-r from-[#FFC703] to-[#FFC703] mb-2"
        >
          <MessageSquare size={18} className="mr-2" />
          Nuovo Canale
        </Button>

        {channels.map((channel) => (
          <Card
            key={channel._id}
            onClick={() => setSelectedChannel(channel)}
            className={`cursor-pointer transition-all ${selectedChannel?._id === channel._id
              ? 'bg-[#495057]/50 border-[#f8f9fa]/30'
              : 'bg-[#343a40]/30 border-[#f8f9fa]/20 hover:bg-[#343a40]/50'
              }`}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                {channel.type === 'team' ? <Users size={14} /> : <Building size={14} />}
                <span className="text-sm font-medium text-[#f8f9fa]">{channel.name}</span>
              </div>
              {channel.last_message && (
                <p className="text-xs text-[#adb5bd] truncate">{channel.last_message}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Messages Area */}
      <div className="col-span-12 lg:col-span-9 max-h-full">
        <Card className="bg-[#343a40]/30 border-[#f8f9fa]/20 h-full flex flex-col max-h-full">
          {selectedChannel ? (
            <>
              <CardHeader className="border-b border-[#f8f9fa]/10">
                <CardTitle className="text-[#f8f9fa] flex items-center gap-2">
                  <Hash size={20} />
                  {selectedChannel.name}
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex ${msg.sender_email === user.email ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl p-3 ${msg.sender_email === user.email
                        ? 'bg-[#FFC703]/30 border border-[#FFC703]/20'
                        : 'bg-[#495057]/30 border border-[#f8f9fa]/10'
                        }`}
                    >
                      <div className="text-xs text-[#adb5bd] mb-1">{msg.sender_name}</div>
                      <p className="text-sm text-[#f8f9fa]">{msg.content}</p>
                      {msg.attachments?.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#FFC703] hover:underline block mt-2"
                        >
                          📎 {att.file_name}
                        </a>
                      ))}
                      <div className="text-xs text-[#6c757d] mt-1">
                        {format(new Date(msg.created_date), 'HH:mm', { locale: it })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </CardContent>

              <div className="p-4 border-t border-[#f8f9fa]/10">
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploadingFile}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={uploadingFile}
                      className="border-[#f8f9fa]/20"
                    >
                      <Paperclip size={18} />
                    </Button>
                  </label>
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Scrivi un messaggio..."
                    className="bg-[#495057]/30 border-[#f8f9fa]/20 text-[#f8f9fa]"
                  />
                  <Button onClick={handleSend} className="bg-[#FFC703]">
                    <Send size={18} />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-[#adb5bd]">
              Seleziona un canale per iniziare
            </div>
          )}
        </Card>
      </div>

      {/* New Channel Dialog */}
      <Dialog open={showNewChannel} onOpenChange={setShowNewChannel}>
        <DialogContent className="bg-[#343a40] border-[#f8f9fa]/20">
          <DialogHeader>
            <DialogTitle className="text-[#f8f9fa]">Nuovo Canale</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[#dee2e6]">Nome Canale</Label>
              <Input
                value={newChannelData.name}
                onChange={(e) => setNewChannelData({ ...newChannelData, name: e.target.value })}
                placeholder="es: Team Marketing"
                className="bg-[#495057] border-[#f8f9fa]/20 text-[#f8f9fa]"
              />
            </div>
            <div>
              <Label className="text-[#dee2e6]">Tipo</Label>
              <Select
                value={newChannelData.type}
                onValueChange={(v) => setNewChannelData({ ...newChannelData, type: v })}
              >
                <SelectTrigger className="bg-[#495057] border-[#f8f9fa]/20 text-[#f8f9fa]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="generale">Generale</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="cantiere">Cantiere</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newChannelData.type === 'team' && (
              <div>
                <Label className="text-[#dee2e6]">Collega a Team</Label>
                <Select
                  value={newChannelData.linked_id}
                  onValueChange={(v) => setNewChannelData({ ...newChannelData, linked_id: v })}
                >
                  <SelectTrigger className="bg-[#495057] border-[#f8f9fa]/20 text-[#f8f9fa]">
                    <SelectValue placeholder="Seleziona team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((t) => (
                      <SelectItem key={t._id} value={t._id}>{t.team_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {newChannelData.type === 'cantiere' && (
              <div>
                <Label className="text-[#dee2e6]">Collega a Cantiere</Label>
                <Select
                  value={newChannelData.linked_id}
                  onValueChange={(v) => setNewChannelData({ ...newChannelData, linked_id: v })}
                >
                  <SelectTrigger className="bg-[#495057] border-[#f8f9fa]/20 text-[#f8f9fa]">
                    <SelectValue placeholder="Seleziona cantiere" />
                  </SelectTrigger>
                  <SelectContent>
                    {cantieri.map((c) => (
                      <SelectItem key={c._id} value={c._id}>{c.nome_cantiere}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              onClick={handleCreateChannel}
              className="w-full"
              disabled={!newChannelData.name}
            >
              Crea Canale
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
