import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageCircle, Send, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ChatDialogProps {
  providerId: string;
  providerName: string;
  primaryColor?: string;
}

interface Message {
  id: string;
  content: string;
  sender_type: 'customer' | 'provider';
  sender_id: string;
  created_at: string;
  is_read: boolean;
}

export const ChatDialog = ({ providerId, providerName, primaryColor = '#1B4332' }: ChatDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get or create conversation
  const { data: conversation, isLoading: conversationLoading } = useQuery({
    queryKey: ['conversation', providerId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // First try to find existing conversation
      const { data: existing, error: findError } = await supabase
        .from('conversations')
        .select('*')
        .eq('provider_id', providerId)
        .eq('customer_id', user.id)
        .maybeSingle();

      if (findError) throw findError;
      if (existing) return existing;

      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          provider_id: providerId,
          customer_id: user.id,
        })
        .select()
        .single();

      if (createError) throw createError;
      return newConversation;
    },
    enabled: !!user?.id && isOpen,
  });

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', conversation?.id],
    queryFn: async () => {
      if (!conversation?.id) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!conversation?.id,
    refetchInterval: 3000, // Poll every 3 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversation?.id || !user?.id) throw new Error('No conversation');

      const { error } = await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        sender_type: 'customer',
        content,
      });

      if (error) throw error;

      // Update conversation last message
      await supabase
        .from('conversations')
        .update({
          last_message: content,
          last_message_at: new Date().toISOString(),
          provider_unread_count: (conversation.provider_unread_count || 0) + 1,
        })
        .eq('id', conversation.id);
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages', conversation?.id] });
      queryClient.invalidateQueries({ queryKey: ['conversation', providerId, user?.id] });
    },
    onError: () => {
      toast.error('فشل في إرسال الرسالة');
    },
  });

  // Mark messages as read
  useEffect(() => {
    if (conversation?.id && isOpen && messages.length > 0) {
      const unreadMessages = messages.filter(
        (m) => m.sender_type === 'provider' && !m.is_read
      );
      
      if (unreadMessages.length > 0) {
        supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', conversation.id)
          .eq('sender_type', 'provider')
          .eq('is_read', false)
          .then(() => {
            // Reset customer unread count
            supabase
              .from('conversations')
              .update({ customer_unread_count: 0 })
              .eq('id', conversation.id);
          });
      }
    }
  }, [conversation?.id, isOpen, messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="text-white/90 hover:bg-white/20 h-10 w-10 rounded-full"
        onClick={() => toast.info('يرجى تسجيل الدخول للمراسلة')}
      >
        <MessageCircle className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-white/90 hover:bg-white/20 h-10 w-10 rounded-full relative"
        >
          <MessageCircle className="h-5 w-5" />
          {conversation?.customer_unread_count ? (
            <span 
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white bg-red-500"
            >
              {conversation.customer_unread_count}
            </span>
          ) : null}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-0 font-arabic h-[80vh] flex flex-col gap-0" dir="rtl">
        <DialogHeader className="p-4 border-b flex-shrink-0 relative">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-right flex-1">محادثة مع {providerName}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-muted"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {conversationLoading || messagesLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>ابدأ المحادثة مع {providerName}</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.sender_type === 'customer' ? 'justify-start' : 'justify-end'
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2",
                          msg.sender_type === 'customer'
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-muted rounded-bl-sm'
                        )}
                        style={msg.sender_type === 'customer' ? { backgroundColor: primaryColor } : {}}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className={cn(
                          "text-[10px] mt-1",
                          msg.sender_type === 'customer' ? 'text-white/70' : 'text-muted-foreground'
                        )}>
                          {format(new Date(msg.created_at), 'p', { locale: ar })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="اكتب رسالتك..."
                  className="flex-1 rounded-full"
                  dir="rtl"
                />
                <Button
                  size="icon"
                  className="rounded-full h-10 w-10 flex-shrink-0"
                  style={{ backgroundColor: primaryColor }}
                  onClick={handleSend}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
