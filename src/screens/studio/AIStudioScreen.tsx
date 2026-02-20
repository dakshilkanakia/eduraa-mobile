import React, { useState, useRef } from 'react'
import {
  View, Text, TextInput, FlatList, StyleSheet,
  TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native'
import { colors } from '../../theme/colors'
import { spacing, radius } from '../../theme/spacing'
import apiClient from '../../api/client'
import type { ChatRequest, ChatResponse } from '../../types'

interface Message { id: string; role: 'user' | 'assistant'; content: string }

export default function AIStudioScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', content: "Hi! I'm your Eduraa AI tutor. Ask me anything about your subjects, get explanations, or test your understanding." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const listRef = useRef<FlatList>(null)

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      // Build history from all messages except the initial greeting
      const history = messages.slice(1).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

      const payload: ChatRequest = {
        message: userMsg.content,
        conversation_id: conversationId,
        history: history.length > 0 ? history : undefined,
      }

      const res = await apiClient.post<ChatResponse>('/ai/chat', payload)
      const aiContent = res.data?.response || 'Sorry, I could not process that.'

      // Keep conversation threaded
      if (res.data?.conversation_id) setConversationId(res.data.conversation_id)

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: aiContent },
      ])
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || 'Sorry, something went wrong. Please try again.'
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: errMsg },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
      <Text style={[styles.bubbleText, item.role === 'user' && styles.userBubbleText]}>{item.content}</Text>
    </View>
  )

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Studio</Text>
        <Text style={styles.headerSub}>Your personal AI tutor</Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd()}
      />

      {loading && (
        <View style={styles.typing}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={styles.typingText}>AI is thinking...</Text>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ask anything..."
          placeholderTextColor={colors.subtle}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={2000}
          onSubmitEditing={sendMessage}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendBtnText}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  header: { padding: spacing[5], paddingTop: spacing[6], borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.ink },
  headerSub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  messageList: { padding: spacing[4], gap: spacing[3] },
  bubble: {
    maxWidth: '80%', padding: spacing[3], borderRadius: radius.xl,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    alignSelf: 'flex-end', backgroundColor: colors.accent,
    borderBottomLeftRadius: radius.xl, borderBottomRightRadius: 4,
  },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  bubbleText: { fontSize: 14, color: colors.ink, lineHeight: 20 },
  userBubbleText: { color: colors.white },
  typing: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], padding: spacing[3], paddingHorizontal: spacing[5] },
  typingText: { fontSize: 13, color: colors.muted },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', padding: spacing[4],
    gap: spacing[2], borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.white,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2,
    paddingHorizontal: spacing[4], paddingVertical: spacing[2],
    fontSize: 15, color: colors.ink,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: radius.full,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: colors.white, fontSize: 20, fontWeight: '700' },
})
