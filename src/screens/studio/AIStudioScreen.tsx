import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  useWindowDimensions,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { colors } from '../../theme/colors'
import { spacing, radius, shadows } from '../../theme/spacing'
import { aiApi } from '../../api/ai'
import type { ChatConversation, ChatMessage } from '../../types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocalMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  pending?: boolean
}

const WELCOME_MESSAGE: LocalMessage = {
  id: '__welcome__',
  role: 'assistant',
  content: "Hi! I'm Eduraa AI — your personal study tutor. Ask me anything about your subjects, get explanations, or challenge yourself with questions.",
  timestamp: new Date(),
}

const SUGGESTIONS = [
  'Analyse my performance and tell me where I need to improve',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function msgTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

// ─── Typing dots ──────────────────────────────────────────────────────────────

function TypingDots() {
  const anims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ]

  useEffect(() => {
    const loops = anims.map((a, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(a, { toValue: -5, duration: 280, useNativeDriver: true }),
          Animated.timing(a, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.delay(560),
        ]),
      ),
    )
    loops.forEach(l => l.start())
    return () => loops.forEach(l => l.stop())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={td.row}>
      <View style={td.avatar}>
        <Ionicons name="sparkles" size={13} color={colors.white} />
      </View>
      <View style={[td.bubble, shadows.xs]}>
        {anims.map((a, i) => (
          <Animated.View key={i} style={[td.dot, { transform: [{ translateY: a }] }]} />
        ))}
      </View>
    </View>
  )
}

const td = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing[2], paddingHorizontal: spacing[4] },
  avatar: {
    width: 28, height: 28, borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  bubble: {
    flexDirection: 'row', gap: 5, alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.xl, borderBottomLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.subtle },
})

// ─── Message bubble ───────────────────────────────────────────────────────────

const MessageBubble = React.memo(function MessageBubble({ msg }: { msg: LocalMessage }) {
  const isUser = msg.role === 'user'
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(10)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Animated.View
      style={[
        mb.row,
        isUser ? mb.userRow : mb.aiRow,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {!isUser && (
        <View style={mb.aiAvatar}>
          <Ionicons name="sparkles" size={13} color={colors.white} />
        </View>
      )}
      <View style={[mb.bubble, isUser ? mb.userBubble : mb.aiBubble, !isUser && shadows.xs]}>
        <Text style={[mb.text, isUser ? mb.userText : mb.aiText]}>{msg.content}</Text>
        <Text style={[mb.time, isUser ? mb.userTime : mb.aiTime]}>{msgTime(msg.timestamp)}</Text>
      </View>
    </Animated.View>
  )
})

const mb = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing[2] },
  userRow: { justifyContent: 'flex-end' },
  aiRow: { justifyContent: 'flex-start' },
  aiAvatar: {
    width: 28, height: 28, borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 2,
  },
  bubble: { maxWidth: '78%', borderRadius: radius.xl, paddingHorizontal: spacing[4], paddingVertical: spacing[3], gap: 4 },
  userBubble: { backgroundColor: colors.accent, borderBottomRightRadius: 4 },
  aiBubble: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  text: { fontSize: 14, lineHeight: 22 },
  userText: { color: colors.white },
  aiText: { color: colors.ink },
  time: { fontSize: 10 },
  userTime: { color: 'rgba(255,255,255,0.55)', textAlign: 'right' },
  aiTime: { color: colors.subtle },
})

// ─── History Panel ────────────────────────────────────────────────────────────

function HistoryPanel({
  visible,
  onClose,
  onSelect,
  onNewChat,
  activeConvId,
}: {
  visible: boolean
  onClose: () => void
  onSelect: (conv: ChatConversation) => void
  onNewChat: () => void
  activeConvId?: string
}) {
  const insets = useSafeAreaInsets()
  const slideAnim = useRef(new Animated.Value(0)).current
  const backdropAnim = useRef(new Animated.Value(0)).current

  const { data: conversations = [], isLoading, refetch } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: aiApi.listConversations,
    enabled: visible,
  })

  useEffect(() => {
    if (visible) {
      refetch()
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 0 }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start()
    }
  }, [visible, slideAnim, backdropAnim, refetch])

  const { width } = useWindowDimensions()
  const panelWidth = Math.min(width * 0.82, 320)

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-panelWidth, 0],
  })

  // Group conversations by date
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  function getGroup(dateStr: string | null): string {
    if (!dateStr) return 'Older'
    const d = new Date(dateStr)
    if (d >= today) return 'Today'
    if (d >= yesterday) return 'Yesterday'
    if (d >= sevenDaysAgo) return 'Previous 7 days'
    return 'Older'
  }

  const grouped: { label: string; items: ChatConversation[] }[] = []
  const seenGroups = new Map<string, ChatConversation[]>()
  for (const conv of conversations) {
    const g = getGroup(conv.last_message_at)
    if (!seenGroups.has(g)) {
      seenGroups.set(g, [])
      grouped.push({ label: g, items: seenGroups.get(g)! })
    }
    seenGroups.get(g)!.push(conv)
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View style={[hp.backdrop, { opacity: backdropAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Side panel */}
      <Animated.View
        style={[
          hp.panel,
          { width: panelWidth, paddingTop: insets.top, transform: [{ translateX }] },
        ]}
      >
        {/* Panel header */}
        <View style={hp.header}>
          <View style={hp.headerLeft}>
            <View style={hp.logo}>
              <Ionicons name="sparkles" size={14} color={colors.white} />
            </View>
            <Text style={hp.title}>Eduraa AI</Text>
          </View>
          <TouchableOpacity style={hp.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={18} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* New chat button */}
        <TouchableOpacity
          style={hp.newBtn}
          onPress={() => { onNewChat(); onClose() }}
          activeOpacity={0.8}
        >
          <View style={hp.newBtnIcon}>
            <Ionicons name="add" size={16} color={colors.accent} />
          </View>
          <Text style={hp.newBtnText}>New conversation</Text>
        </TouchableOpacity>

        <View style={hp.divider} />

        {/* Conversation list */}
        {isLoading ? (
          <View style={hp.loading}>
            <ActivityIndicator size="small" color={colors.accent} />
          </View>
        ) : conversations.length === 0 ? (
          <View style={hp.empty}>
            <Text style={hp.emptyText}>No past conversations yet</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
            {grouped.map(group => (
              <View key={group.label}>
                <Text style={hp.groupLabel}>{group.label}</Text>
                {group.items.map(conv => {
                  const isActive = conv.id === activeConvId
                  return (
                    <TouchableOpacity
                      key={conv.id}
                      style={[hp.convRow, isActive && hp.convRowActive]}
                      onPress={() => { onSelect(conv); onClose() }}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name="chatbubble-outline"
                        size={14}
                        color={isActive ? colors.accent : colors.subtle}
                        style={{ marginTop: 1, flexShrink: 0 }}
                      />
                      <View style={{ flex: 1, overflow: 'hidden' }}>
                        <Text style={[hp.convTitle, isActive && hp.convTitleActive]} numberOfLines={1}>
                          {conv.title || 'New chat'}
                        </Text>
                        {conv.last_message_at ? (
                          <Text style={hp.convTime}>{relativeTime(conv.last_message_at)}</Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>
            ))}
          </ScrollView>
        )}
      </Animated.View>
    </Modal>
  )
}

const hp = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28,25,23,0.4)',
  },
  panel: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    backgroundColor: colors.card,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[4], paddingVertical: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  logo: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 15, fontWeight: '800', color: colors.ink, letterSpacing: -0.2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: radius.md,
    backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center',
  },

  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    marginHorizontal: spacing[3], marginVertical: spacing[3],
    paddingHorizontal: spacing[3], paddingVertical: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.accentMid,
    backgroundColor: colors.accentLight,
  },
  newBtnIcon: {
    width: 26, height: 26, borderRadius: radius.sm,
    backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
  },
  newBtnText: { fontSize: 13, fontWeight: '700', color: colors.accent },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginBottom: spacing[2] },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  empty: { paddingTop: spacing[6], alignItems: 'center' },
  emptyText: { fontSize: 13, color: colors.subtle },

  groupLabel: {
    fontSize: 10, fontWeight: '700', color: colors.subtle,
    textTransform: 'uppercase', letterSpacing: 0.7,
    paddingHorizontal: spacing[4], paddingTop: spacing[3], paddingBottom: spacing[1],
  },
  convRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3],
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
    borderRadius: radius.lg, marginHorizontal: spacing[2],
  },
  convRowActive: { backgroundColor: colors.accentLight },
  convTitle: { fontSize: 13, fontWeight: '500', color: colors.ink },
  convTitleActive: { fontWeight: '700', color: colors.accentStrong },
  convTime: { fontSize: 11, color: colors.subtle, marginTop: 2 },
})

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AIStudioScreen() {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const queryClient = useQueryClient()

  const [messages, setMessages] = useState<LocalMessage[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [activeConvTitle, setActiveConvTitle] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)

  const listRef = useRef<FlatList>(null)
  const inputRef = useRef<TextInput>(null)

  const showSuggestions = messages.length === 1 && !loading

  const scrollToEnd = useCallback((animated = true) => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated }), 80)
  }, [])

  // ── Send a message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || loading) return

    const userMsg: LocalMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    scrollToEnd()

    try {
      const res = await aiApi.chat({
        message: content,
        conversation_id: conversationId,
      })

      if (res.conversation_id) {
        setConversationId(res.conversation_id)
        // Invalidate conversation list so it reflects the new/updated conversation
        queryClient.invalidateQueries({ queryKey: ['ai-conversations'] })
      }

      setMessages(prev => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          content: res.response || 'Sorry, I could not process that.',
          timestamp: new Date(),
        },
      ])
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Something went wrong. Please try again.'
      setMessages(prev => [
        ...prev,
        { id: `err_${Date.now()}`, role: 'assistant', content: msg, timestamp: new Date() },
      ])
    } finally {
      setLoading(false)
      scrollToEnd()
    }
  }, [input, loading, conversationId, queryClient, scrollToEnd])

  // ── New chat ────────────────────────────────────────────────────────────────
  const startNewChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE])
    setConversationId(undefined)
    setActiveConvTitle(null)
    setInput('')
    setLoading(false)
  }, [])

  // ── Load a past conversation ────────────────────────────────────────────────
  const loadConversation = useCallback(async (conv: ChatConversation) => {
    setLoadingHistory(true)
    setConversationId(conv.id)
    setActiveConvTitle(conv.title)
    try {
      const msgs = await aiApi.getMessages(conv.id)
      const localMsgs: LocalMessage[] = msgs.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.created_at),
      }))
      setMessages(localMsgs.length > 0 ? localMsgs : [WELCOME_MESSAGE])
      scrollToEnd(false)
    } catch {
      setMessages([WELCOME_MESSAGE])
    } finally {
      setLoadingHistory(false)
    }
  }, [scrollToEnd])

  const canSend = input.trim().length > 0 && !loading

  return (
    <View style={styles.root}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing[2] }]}>
        <TouchableOpacity style={styles.topBtn} onPress={() => setShowHistory(true)} activeOpacity={0.75}>
          <Ionicons name="menu" size={20} color={colors.ink} />
        </TouchableOpacity>

        <View style={styles.topCenter}>
          <Text style={styles.topTitle} numberOfLines={1}>
            {activeConvTitle || 'Eduraa AI'}
          </Text>
          {!activeConvTitle && (
            <View style={styles.onlinePill}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>online</Text>
            </View>
          )}
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* ─── Keyboard wrapper — KEY FIX ──────────────────────────────────── */}
      {/*
        behavior="padding" pushes content up by keyboard height.
        keyboardVerticalOffset must be 0 here — the KAV is below our
        custom topBar, so there is nothing above it to offset.
        The topBar is OUTSIDE the KAV so it doesn't move.
      */}
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        {loadingHistory ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={styles.loadingText}>Loading conversation…</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <MessageBubble msg={item} />}
            contentContainerStyle={styles.messageList}
            ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
            onContentSizeChange={() => scrollToEnd(false)}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            ListFooterComponent={
              loading ? (
                <View style={{ marginTop: spacing[3] }}>
                  <TypingDots />
                </View>
              ) : null
            }
          />
        )}

        {/* Suggestions */}
        {showSuggestions && (
          <View style={styles.suggestions}>
            <TouchableOpacity
              style={styles.chip}
              onPress={() => sendMessage(SUGGESTIONS[0])}
              activeOpacity={0.8}
            >
              <View style={styles.chipIconWrap}>
                <Ionicons name="bar-chart-outline" size={15} color={colors.accent} />
              </View>
              <Text style={styles.chipText}>{SUGGESTIONS[0]}</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.accent} />
            </TouchableOpacity>
          </View>
        )}

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            { paddingBottom: Math.max(insets.bottom, 12) },
            inputFocused && styles.inputBarFocused,
          ]}
        >
          <View style={[styles.inputWrap, inputFocused && styles.inputWrapFocused]}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Ask Eduraa…"
              placeholderTextColor={colors.placeholder}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={2000}
              returnKeyType="default"
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
            <TouchableOpacity
              style={[styles.sendBtn, canSend && styles.sendBtnActive]}
              onPress={() => sendMessage()}
              disabled={!canSend}
              activeOpacity={0.82}
            >
              <Ionicons
                name="arrow-up"
                size={17}
                color={canSend ? colors.white : colors.subtle}
              />
            </TouchableOpacity>
          </View>
          {input.length > 200 && (
            <Text style={styles.charCount}>{input.length}/2000</Text>
          )}
          <Text style={styles.disclaimer}>Eduraa AI can make mistakes. Verify important info.</Text>
        </View>
      </KeyboardAvoidingView>

      {/* History panel */}
      <HistoryPanel
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        onSelect={loadConversation}
        onNewChat={startNewChat}
        activeConvId={conversationId}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface1 },
  kav: { flex: 1 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
    paddingBottom: spacing[3],
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    ...shadows.xs,
  },
  topBtn: {
    width: 40, height: 40, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  topCenter: { flex: 1, alignItems: 'center', gap: 3 },
  topTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, letterSpacing: -0.2 },
  onlinePill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  onlineText: { fontSize: 11, color: colors.success, fontWeight: '600' },

  // Messages
  messageList: { padding: spacing[4], paddingBottom: spacing[3] },

  loadingCenter: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3],
  },
  loadingText: { fontSize: 14, color: colors.muted },

  // Suggestions
  suggestions: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.accentMid,
    backgroundColor: colors.accentLight,
  },
  chipIconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chipText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.accentStrong },

  // Input bar
  inputBar: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  inputBarFocused: {
    borderTopColor: colors.accentMid,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    paddingLeft: spacing[4],
    paddingRight: spacing[2],
    paddingVertical: spacing[2],
    minHeight: 50,
    gap: spacing[2],
  },
  inputWrapFocused: {
    borderColor: colors.accent,
    backgroundColor: colors.card,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.ink,
    maxHeight: 130,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
    lineHeight: 22,
  },
  sendBtn: {
    width: 36, height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surface3,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginBottom: 1,
  },
  sendBtnActive: { backgroundColor: colors.accent },
  charCount: { textAlign: 'right', fontSize: 10, color: colors.subtle, marginTop: 3 },
  disclaimer: {
    textAlign: 'center', fontSize: 10, color: colors.subtle,
    marginTop: spacing[2], marginBottom: spacing[1],
  },
})
