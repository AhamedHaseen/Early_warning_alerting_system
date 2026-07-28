import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Shield, Search, Paperclip, MoreVertical, MessageSquare } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';

const StudentMessages = () => {
  const { user } = useAuth();
  const [recipientType, setRecipientType] = useState('lecturer'); // 'lecturer', 'admin'
  const [activeChat, setActiveChat] = useState(null);
  
  const [profiles, setProfiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (activeChat && user) {
      fetchMessages(activeChat.id);
      
      // Mark as read
      supabase.from('messages').update({ is_read: true }).eq('sender_id', activeChat.id).eq('receiver_id', user.id).eq('is_read', false).then();
      setUnreadCounts(prev => ({ ...prev, [activeChat.id]: 0 }));
      
      const subscription = supabase
        .channel('student_messages_channel')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `sender_id=eq.${activeChat.id}`
        }, payload => {
          if (payload.new.receiver_id === user.id) {
            setMessages(prev => [...prev, payload.new]);
            scrollToBottom();
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [activeChat, user]);

  const fetchProfiles = async () => {
    try {
      const [profilesRes, unreadRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, role').in('role', ['lecturer', 'admin']).order('full_name'),
        supabase.from('messages').select('sender_id').eq('receiver_id', user.id).eq('is_read', false)
      ]);
        
      if (profilesRes.data) {
        setProfiles(profilesRes.data);
      }
      
      if (unreadRes.data) {
        const counts = {};
        unreadRes.data.forEach(m => counts[m.sender_id] = (counts[m.sender_id] || 0) + 1);
        setUnreadCounts(counts);
      }
    } catch (err) {
      console.error('Error fetching profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('sent_at', { ascending: true });
        
      if (!error && data) {
        setMessages(data);
        scrollToBottom();
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !user) return;
    
    const msgData = {
      sender_id: user.id,
      receiver_id: activeChat.id,
      content: newMessage.trim(),
    };
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([msgData])
        .select()
        .single();
        
      if (!error && data) {
        setMessages(prev => [...prev, data]);
        setNewMessage('');
        scrollToBottom();
        
        // Insert notification for recipient
        supabase.from('notifications').insert([{
          user_id: activeChat.id,
          title: 'New Message',
          message: `You have received a new message.`
        }]).then();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredProfiles = profiles.filter(p => p.role === recipientType);

  return (
    <div className="h-[calc(100vh-8rem)] flex animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/30">
        <div className="p-4 border-b border-slate-100">
          <h1 className="text-xl font-bold text-slate-800 mb-4">Messages</h1>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            />
          </div>
        </div>

        <div className="flex p-2 space-x-1 border-b border-slate-100">
          <button 
            onClick={() => setRecipientType('lecturer')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${recipientType === 'lecturer' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Lecturers
          </button>
          <button 
            onClick={() => setRecipientType('admin')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${recipientType === 'admin' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Admins
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
             <div className="p-8 text-center text-slate-500 text-sm">Loading users...</div>
          ) : filteredProfiles.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
              No users found.
            </div>
          ) : (
            filteredProfiles.map(profile => (
              <div 
                key={profile.id} 
                onClick={() => setActiveChat(profile)}
                className={`p-4 border-b border-slate-50 cursor-pointer transition-colors flex items-start space-x-3 hover:bg-blue-50/50 ${activeChat?.id === profile.id ? 'bg-blue-50/80 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                  {profile.role === 'lecturer' && <User className="w-5 h-5" />}
                  {profile.role === 'admin' && <Shield className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800 truncate pr-2">{profile.full_name || 'Unknown User'}</h3>
                  {unreadCounts[profile.id] > 0 && (
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                      {unreadCounts[profile.id]}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      {activeChat ? (
        <div className="flex-1 flex flex-col bg-white">
          <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                {activeChat.role === 'lecturer' && <User className="w-5 h-5" />}
                {activeChat.role === 'admin' && <Shield className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="font-semibold text-slate-800">{activeChat.full_name || 'Unknown User'}</h2>
                <p className="text-xs text-slate-500 capitalize">{activeChat.role}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto bg-slate-50/30">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-slate-400 text-sm">No messages yet. Send a message to start the conversation.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex items-end space-x-2 ${isMe ? 'justify-end' : ''}`}>
                      {!isMe && <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center"><User className="w-4 h-4 text-slate-500" /></div>}
                      <div className={`px-4 py-2 max-w-[70%] shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm' : 'bg-white border border-slate-100 rounded-2xl rounded-bl-sm'}`}>
                        <p className={`text-sm ${isMe ? 'text-white' : 'text-slate-700'}`}>{msg.content}</p>
                        <span className={`text-[10px] mt-1 block ${isMe ? 'text-blue-200 text-right' : 'text-slate-400'}`}>
                          {formatTime(msg.sent_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white">
            <div className="flex items-end space-x-2">
              <button type="button" className="p-2 text-slate-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors shrink-0">
                <Paperclip className="w-5 h-5" />
              </button>
              <input 
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..." 
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
              />
              <button type="submit" disabled={!newMessage.trim()} className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shrink-0 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
          <div className="w-20 h-20 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">Your Messages</h2>
          <p className="text-slate-500 mt-2 text-sm text-center max-w-sm">Select a conversation from the sidebar to start messaging or create a new one.</p>
        </div>
      )}

    </div>
  );
};

export default StudentMessages;
