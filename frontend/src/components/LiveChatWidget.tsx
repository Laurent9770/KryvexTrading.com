import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';
import chatService, { ChatMessage, ChatRoom } from '@/services/chatService';
import websocketService from '@/services/websocketService';
import { 
  MessageCircle, 
  X, 
  Send, 
  Paperclip, 
  Minimize2,
  Maximize2,
  User,
  Clock,
  MessageSquare,
  Upload
} from 'lucide-react';

const LiveChatWidget = () => {
  const { user, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string>('general');
  const [isTyping, setIsTyping] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (user && isOpen) {
      loadRooms();
      joinCurrentRoom();
      setIsConnected(true);
      
      // Show welcome message for new users
      if (!isAdmin && currentRoom === 'general') {
        const welcomeMessage = {
          id: `welcome-${Date.now()}`,
          userId: 'system',
          userName: 'System',
          message: `Welcome to Kryvex Trading Platform! How can we help you today?`,
          timestamp: new Date().toISOString(),
          room: 'general',
          type: 'system' as const
        };
        setMessages([welcomeMessage]);
      }
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (currentRoom) {
      loadMessages();
      subscribeToMessages();
    }
  }, [currentRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadRooms = async () => {
    try {
      // Listen for room updates from the permission system
      chatService.on('rooms_updated', (updatedRooms: any[]) => {
        setRooms(updatedRooms);
        
        // Set default room based on user type and available rooms
        if (isAdmin) {
          const adminRoom = updatedRooms.find(room => room.type === 'admin');
          if (adminRoom) {
            setCurrentRoom(adminRoom.id);
            loadUsers(); // Load users for admin channel
          }
        } else {
          const supportRoom = updatedRooms.find(room => room.type === 'general');
          if (supportRoom) {
            setCurrentRoom(supportRoom.id);
          }
        }
      });
      
      // Get user's accessible rooms from WebSocket
      websocketService.getUserRooms();
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadUsers = async () => {
    if (!isAdmin) return;
    
    try {
      setLoadingUsers(true);
      const chatUsers = await chatService.getUsers();
      setUsers(chatUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const joinCurrentRoom = async () => {
    try {
      await chatService.joinRoom(currentRoom);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const loadMessages = async () => {
    try {
      setLoadingMessages(true);
      const roomMessages = await chatService.getMessages(currentRoom);
      setMessages(roomMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const subscribeToMessages = () => {
    const handleMessageReceived = (message: ChatMessage) => {
      console.log('Message received:', message);
      if (message.room === currentRoom) {
        setMessages(prev => [...prev, message]);
      }
    };

    const handleMessageSent = (message: ChatMessage) => {
      console.log('Message sent:', message);
      if (message.room === currentRoom) {
        setMessages(prev => [...prev, message]);
      }
    };

    chatService.on('message_received', handleMessageReceived);
    chatService.on('message_sent', handleMessageSent);

    return () => {
      chatService.off('message_received', handleMessageReceived);
      chatService.off('message_sent', handleMessageSent);
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if ((!message.trim() && uploadedFiles.length === 0) || !user || sendingMessage) return;

    const messageText = message.trim();
    const filesToSend = [...uploadedFiles];
    
    setMessage(''); // Clear input immediately for better UX
    setUploadedFiles([]); // Clear uploaded files
    setSendingMessage(true);

    try {
      // Send the message
      await chatService.sendMessage(
        messageText,
        currentRoom,
        user.email?.split('@')[0] || user.email || 'Anonymous',
        isAdmin ? 'admin' : 'user'
      );
      
      // Send file information if files were uploaded
      if (filesToSend.length > 0) {
        const fileNames = filesToSend.map(file => file.name).join(', ');
        await chatService.sendMessage(
          `📎 Attached files: ${fileNames}`,
          currentRoom,
          user.email?.split('@')[0] || user.email || 'Anonymous',
          'system'
        );
      }
      
      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore the message and files if sending failed
      setMessage(messageText);
      setUploadedFiles(filesToSend);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set typing indicator
    setIsTyping(true);
    
    // Clear typing indicator after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const changeRoom = async (roomId: string) => {
    try {
      await chatService.leaveRoom(currentRoom);
      setCurrentRoom(roomId);
      await chatService.joinRoom(roomId);
      setMessages([]);
      
      // Load users if switching to admin channel
      if (isAdmin && roomId === 'admin') {
        loadUsers();
      }
    } catch (error) {
      console.error('Error changing room:', error);
    }
  };

  const getRoomName = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    return room?.name || roomId;
  };

  const formatTimestamp = (timestamp: string) => {
    return chatService.formatTimestamp(timestamp);
  };

  const isMessageFromCurrentUser = (message: ChatMessage) => {
    return chatService.isMessageFromCurrentUser(message);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      // Show toast for uploaded files
      newFiles.forEach(file => {
        toast({
          title: "File uploaded",
          description: `${file.name} has been uploaded`,
        });
      });
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  if (!user) return null;

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg"
          size="lg"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <Card className="fixed bottom-32 right-4 z-50 w-80 h-[500px] bg-slate-900 border-slate-700 shadow-2xl max-h-[80vh]">
          {/* Header */}
          <CardHeader className="bg-slate-800 border-b border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-white font-semibold">Live Chat</h3>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs text-slate-400">
                      {getRoomName(currentRoom)}
                    </p>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-xs text-slate-400">
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-slate-400 hover:text-white"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {!isMinimized && (
            <>
              {/* Room Selector */}
              <div className="p-2 bg-slate-800 border-b border-slate-700">
                <div className="flex space-x-1">
                  {rooms
                    .filter(room => {
                      // Admin can see all rooms
                      if (isAdmin) return true;
                      // Regular users can only see general and support rooms
                      return room.id === 'general' || room.id === 'support';
                    })
                    .map((room) => (
                      <Button
                        key={room.id}
                        variant={currentRoom === room.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => changeRoom(room.id)}
                        className="text-xs"
                      >
                        {room.name}
                      </Button>
                    ))}
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4 h-80">
                <div className="space-y-3">
                  {loadingMessages ? (
                    <div className="flex justify-center py-4">
                      <div className="text-slate-400 text-sm">Loading messages...</div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex justify-center py-4">
                      <div className="text-slate-400 text-sm">No messages yet. Start the conversation!</div>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${isMessageFromCurrentUser(msg) ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg ${
                            isMessageFromCurrentUser(msg)
                              ? 'bg-blue-600 text-white'
                              : msg.type === 'admin'
                              ? 'bg-purple-600 text-white'
                              : msg.type === 'system'
                              ? 'bg-yellow-600 text-white'
                              : 'bg-slate-700 text-white'
                          }`}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <User className="w-3 h-3" />
                            <span className="text-xs opacity-75">
                              {msg.userName}
                            </span>
                            <Clock className="w-3 h-3" />
                            <span className="text-xs opacity-75">
                              {formatTimestamp(msg.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm">{msg.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-slate-700 text-white px-3 py-2 rounded-lg">
                        <p className="text-sm">Typing...</p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Admin Channel - Users List */}
              {isAdmin && currentRoom === 'admin' && (
                <div className="p-4 border-t border-slate-700 bg-slate-800">
                  <h4 className="text-sm font-semibold text-white mb-2">Online Users</h4>
                  {loadingUsers ? (
                    <div className="text-center py-2">
                      <p className="text-xs text-slate-400">Loading users...</p>
                    </div>
                  ) : users.length > 0 ? (
                    <div className="space-y-1">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center space-x-2 text-xs">
                          <div className={`w-2 h-2 rounded-full ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`} />
                          <span className="text-slate-300">{user.name}</span>
                          <span className="text-slate-500">({user.email})</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-xs text-red-400">Failed to load users</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={loadUsers}
                        className="mt-1 text-xs"
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Message Input */}
              <div className="p-4 border-t-2 border-slate-600 bg-slate-800 min-h-[120px]">
                {/* File Upload Area */}
                {uploadedFiles.length > 0 && (
                  <div className="mb-3 p-2 bg-slate-700 rounded-lg">
                    <div className="text-xs text-slate-300 mb-2">Attached files:</div>
                    <div className="space-y-1">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 truncate">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-red-400 hover:text-red-300 p-1 h-auto"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs text-slate-400 font-medium">💬 Message:</span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={triggerFileUpload}
                    variant="outline"
                    size="sm"
                    className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                    title="Upload file"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                  <Input
                    value={message}
                    onChange={handleTyping}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message or upload files..."
                    className="flex-1 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={(!message.trim() && uploadedFiles.length === 0) || sendingMessage}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {sendingMessage ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                  aria-label="Upload files"
                  title="Upload files"
                />
              </div>
            </>
          )}
        </Card>
      )}
    </>
  );
};

export default LiveChatWidget;