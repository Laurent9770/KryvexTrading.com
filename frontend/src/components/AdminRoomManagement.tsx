import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import websocketService from '@/services/websocketService';
import { Plus, Users, MessageCircle, Trash2 } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  isAdminOnly: boolean;
  userCount: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  status: string;
}

export const AdminRoomManagement = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomId, setNewRoomId] = useState('');
  const [isAdminOnly, setIsAdminOnly] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');

  useEffect(() => {
    if (user) {
      loadRooms();
      loadUsers();
    }
  }, [user]);

  const loadRooms = () => {
    websocketService.on('all_rooms', (roomList: Room[]) => {
      setRooms(roomList);
    });
    websocketService.getAllRooms();
  };

  const loadUsers = () => {
    // TODO: Implement real API call to fetch users
    // const response = await fetch('/api/admin/users');
    // const users = await response.json();
    // setUsers(users);
    
    // For now, set empty array until real API is implemented
    setUsers([]);
  };

  const createRoom = () => {
    if (!newRoomName.trim() || !newRoomId.trim()) {
      toast({
        title: "Error",
        description: "Please enter both room name and ID",
        variant: "destructive"
      });
      return;
    }

    websocketService.createRoom(newRoomId, newRoomName, isAdminOnly);
    
    toast({
      title: "Success",
      description: `Room "${newRoomName}" created successfully`,
    });

    setNewRoomName('');
    setNewRoomId('');
    setIsAdminOnly(false);
  };

  const addUserToRoom = () => {
    if (!selectedUser || !selectedRoom) {
      toast({
        title: "Error",
        description: "Please select both user and room",
        variant: "destructive"
      });
      return;
    }

    websocketService.addUserToRoom(user?.id || '', selectedUser, selectedRoom);
    
    toast({
      title: "Success",
      description: `User added to room successfully`,
    });

    setSelectedUser('');
    setSelectedRoom('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Room Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create New Room */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Create New Room</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Room ID (e.g., support-team)"
                value={newRoomId}
                onChange={(e) => setNewRoomId(e.target.value)}
              />
              <Input
                placeholder="Room Name (e.g., Support Team)"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
              />
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="adminOnly"
                  checked={isAdminOnly}
                  onChange={(e) => setIsAdminOnly(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="adminOnly" className="text-sm">Admin Only</label>
              </div>
              <Button onClick={createRoom} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Room
              </Button>
            </div>
          </div>

          {/* Add User to Room */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Add User to Room</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select User" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name} ({room.userCount} users)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={addUserToRoom} className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Add User
              </Button>
            </div>
          </div>

          {/* Room List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">All Rooms</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <Card key={room.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{room.name}</h4>
                      <p className="text-sm text-muted-foreground">ID: {room.id}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={room.isAdminOnly ? "destructive" : "secondary"}>
                          {room.isAdminOnly ? "Admin Only" : "Public"}
                        </Badge>
                        <Badge variant="outline">
                          {room.userCount} users
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 