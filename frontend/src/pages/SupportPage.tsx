import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabaseSupportService } from '@/services/supabaseSupportService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Loader2, MessageSquare, Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface SupportTicket {
  id: string
  subject: string
  status: 'open' | 'in_progress' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  messages?: any[]
}

const SupportPage: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingTicket, setCreatingTicket] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [newTicket, setNewTicket] = useState({
    subject: '',
    priority: 'medium' as const,
    message: ''
  })

  useEffect(() => {
    if (user) {
      supabaseSupportService.setUserId(user.id)
      loadTickets()
    }
  }, [user])

  const loadTickets = async () => {
    try {
      setLoading(true)
      const data = await supabaseSupportService.getMyTickets()
      setTickets(data)
    } catch (error) {
      console.error('Error loading tickets:', error)
      toast({
        title: 'Error',
        description: 'Failed to load support tickets',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const createTicket = async () => {
    if (!newTicket.subject || !newTicket.message) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    try {
      setCreatingTicket(true)
      const ticket = await supabaseSupportService.createTicket(newTicket.subject, newTicket.priority)
      
      // Add initial message
      await supabaseSupportService.addMessage(ticket.id, newTicket.message)
      
      toast({
        title: 'Success',
        description: 'Support ticket created successfully'
      })
      
      setNewTicket({ subject: '', priority: 'medium', message: '' })
      loadTickets()
    } catch (error) {
      console.error('Error creating ticket:', error)
      toast({
        title: 'Error',
        description: 'Failed to create support ticket',
        variant: 'destructive'
      })
    } finally {
      setCreatingTicket(false)
    }
  }

  const addMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return

    try {
      await supabaseSupportService.addMessage(selectedTicket.id, newMessage)
      setNewMessage('')
      loadTickets()
      toast({
        title: 'Success',
        description: 'Message sent successfully'
      })
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'in_progress':
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Support Center</h1>
          <p className="text-muted-foreground">Get help with your account and trading</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
              <DialogDescription>
                Describe your issue and we'll get back to you as soon as possible.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={newTicket.priority}
                  onValueChange={(value: any) => setNewTicket({ ...newTicket, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  placeholder="Describe your issue in detail..."
                  rows={4}
                />
              </div>
              <Button onClick={createTicket} disabled={creatingTicket} className="w-full">
                {creatingTicket && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Ticket
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Tickets</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {tickets.map((ticket) => (
              <Card key={ticket.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(ticket.status)}
                      <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                    </div>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  <CardDescription>
                    Created {new Date(ticket.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <Badge variant={ticket.status === 'closed' ? 'secondary' : 'default'}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="open" className="space-y-4">
          <div className="grid gap-4">
            {tickets.filter(t => t.status === 'open').map((ticket) => (
              <Card key={ticket.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(ticket.status)}
                      <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                    </div>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  <CardDescription>
                    Created {new Date(ticket.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <Badge variant="default">Open</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4">
          <div className="grid gap-4">
            {tickets.filter(t => t.status === 'in_progress').map((ticket) => (
              <Card key={ticket.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(ticket.status)}
                      <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                    </div>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  <CardDescription>
                    Created {new Date(ticket.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <Badge variant="default">In Progress</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="closed" className="space-y-4">
          <div className="grid gap-4">
            {tickets.filter(t => t.status === 'closed').map((ticket) => (
              <Card key={ticket.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(ticket.status)}
                      <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                    </div>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  <CardDescription>
                    Created {new Date(ticket.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <Badge variant="secondary">Closed</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Ticket Details Dialog */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTicket.subject}</DialogTitle>
              <DialogDescription>
                Ticket #{selectedTicket.id} - {selectedTicket.status.replace('_', ' ')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Badge className={getPriorityColor(selectedTicket.priority)}>
                  {selectedTicket.priority}
                </Badge>
                <Badge variant={selectedTicket.status === 'closed' ? 'secondary' : 'default'}>
                  {selectedTicket.status.replace('_', ' ')}
                </Badge>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === 'Enter' && addMessage()}
                  />
                  <Button onClick={addMessage} disabled={!newMessage.trim()}>
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default SupportPage
