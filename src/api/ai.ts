import apiClient from './client'
import type { ChatConversation, ChatMessage, ChatRequest, ChatResponse } from '../types'

export const aiApi = {
  /** List all conversations for the current user, newest first */
  listConversations: async (): Promise<ChatConversation[]> => {
    const res = await apiClient.get<ChatConversation[]>('/ai/conversations')
    return res.data
  },

  /** Get all messages in a conversation */
  getMessages: async (conversationId: string): Promise<ChatMessage[]> => {
    const res = await apiClient.get<ChatMessage[]>(`/ai/conversations/${conversationId}/messages`)
    return res.data
  },

  /** Send a chat message */
  chat: async (payload: ChatRequest): Promise<ChatResponse> => {
    const res = await apiClient.post<ChatResponse>('/ai/chat', payload)
    return res.data
  },
}
