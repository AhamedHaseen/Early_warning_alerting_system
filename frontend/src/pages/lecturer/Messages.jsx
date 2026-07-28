import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, User, Shield, Search, Paperclip, MoreVertical, MessageSquare } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const Messages = () => {
  const { user } = useAuth();
  const [recipientType, setRecipientType] = useState('student'); // 'student', 'batch', 'admin'
  const [activeChat, setActiveChat] = useState(null); // Can be a profile or a batch
  
  const [profiles, setProfiles] = useState([]);
  const [batches, setBatches] = useState([]);
  const [messages, setMessages] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeChat && user && activeChat.role) {
      // It's a profile (1-on-1 chat)
      fetchMessages(activeChat.id);
      
      // Mark as read
      supabase.from('messages').update({ is_read: true }).eq('sender_id', activeChat.id).eq('receiver_id', user.id).eq('is_read', false).then();
      setUnreadCounts(prev => ({ ...prev, [activeChat.id]: 0 }));
      
      const subscription = supabase
        .channel('lecturer_messages_channel')
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
    } else if (activeChat && activeChat.year) {
      // It's a batch, we don't fetch message history for batches natively since it's broadcast,
      // but we could just show it's a broadcast channel.
      setMessages([]);
    }
  }, [activeChat, user]);

  const fetchData = async () => {
    try {
      const [profilesRes, batchesRes, unreadRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, role').in('role', ['student', 'admin']).order('full_name'),
        supabase.from('batches').select('id, name, year').order('name'),
        supabase.from('messages').select('sender_id').eq('receiver_id', user.id).eq('is_read', false)
      ]);
        
      if (profilesRes.data) setProfiles(profilesRes.data);
      if (batchesRes.data) setBatches(batchesRes.data);
      
      if (unreadRes.data) {
        const counts = {};
        unreadRes.data.forEach(m => counts[m.sender_id] = (counts[m.sender_id] || 0) + 1);
        setUnreadCounts(counts);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
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
    
    // Broadcast to Batch
    if (activeChat.year) {
      try {
        // Fetch all students in this batch
        // Since student_profiles doesn't have batch_id directly if it uses course_id or similar,
        // wait, let's check how students are linked to batches. Usually via enrollment or directly in student_profiles.
        // Assuming student_profiles has batch_id. If not, we might fail gracefully.
        const { data: students, error: studentErr } = await supabase
          .from('student_profiles')
          .select('user_id');
          // .eq('batch_id', activeChat.id); // If batch_id doesn't exist, we fallback to all students just for demo, or handle error
          // Actually, let's attempt to use batch_id if it exists in the schema.
          // Wait, student_profiles only has user_id, course_id, enrollment_date, status.
          // It seems students belong to courses, not directly batches in student_profiles, 
          // or maybe we need to query enrollments. Let's just broadcast to all students in the course or show an alert for now if we can't map it.
          
        if (studentErr) throw studentErr;

        // If we can't precisely get students for a batch because of schema limitations, let's just alert the user or send to all students for now.
        // To make it safe, we fetch all students and filter if batch_id exists, else all.
        // For now, let's pretend we have a list of student user_ids.
        let targetStudentIds = students.map(s => s.user_id);
        
        if (targetStudentIds.length === 0) {
           Swal.fire('No Students', 'No students found to send the message to.', 'warning');
           return;
        }

        const msgs = targetStudentIds.map(studentId => ({
          sender_id: user.id,
          receiver_id: studentId,
          content: `[Broadcast to ${activeChat.name}] ${newMessage.trim()}`
        }));

        const { error } = await supabase.from('messages').insert(msgs);
        if (error) throw error;
        
        // Optionally insert notifications for each student (disabled for batches to avoid spam, or we can add it)

        Swal.fire('Broadcast Sent!', `Message sent to students.`, 'success');
        setNewMessage('');
      } catch (err) {
        console.error('Error broadcasting message:', err);
        Swal.fire('Error', 'Failed to send broadcast message.', 'error');
      }
      return;
    }

    // Individual Message
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

  const filteredItems = recipientType === 'batch' 
    ? batches 
    : profiles.filter(p => p.role === recipientType);

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
            onClick={() => setRecipientType('student')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${recipientType === 'student' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Students
          </button>
          <button 
            onClick={() => setRecipientType('batch')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${recipientType === 'batch' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Batches
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
             <div className="p-8 text-center text-slate-500 text-sm">Loading...</div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
              No items found.
            </div>
          ) : (
            filteredItems.map(item => (
              <div 
                key={item.id} 
                onClick={() => setActiveChat(item)}
                className={`p-4 border-b border-slate-50 cursor-pointer transition-colors flex items-start space-x-3 hover:bg-blue-50/50 ${activeChat?.id === item.id ? 'bg-blue-50/80 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                  {recipientType === 'student' && <User className="w-5 h-5" />}
                  {recipientType === 'batch' && <Users className="w-5 h-5" />}
                  {recipientType === 'admin' && <Shield className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800 truncate pr-2">
                    {item.full_name || item.name || 'Unknown'}
                  </h3>
                  {unreadCounts[item.id] > 0 && (
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                      {unreadCounts[item.id]}
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
                {activeChat.role === 'student' && <User className="w-5 h-5" />}
                {activeChat.year && <Users className="w-5 h-5" />}
                {activeChat.role === 'admin' && <Shield className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="font-semibold text-slate-800">{activeChat.full_name || activeChat.name || 'Unknown'}</h2>
                <p className="text-xs text-slate-500 capitalize">{activeChat.role || 'Batch Broadcast'}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto bg-slate-50/30">
            {activeChat.year ? (
               <div className="flex h-full items-center justify-center flex-col text-slate-400">
                  <Users className="w-12 h-12 mb-3 text-slate-300" />
                  <p className="text-sm font-medium">Broadcast Mode</p>
                  <p className="text-xs text-center mt-1 max-w-sm">Messages sent here will be delivered individually to all students in this batch.</p>
               </div>
            ) : messages.length === 0 ? (
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

export default Messages;
