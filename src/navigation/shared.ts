/**
 * Shared navigation options used by both StudentTabs and TeacherTabs stacks.
 */

import { colors } from '../theme/colors'

export const stackScreenOptions = {
  headerStyle: {
    backgroundColor: colors.card,
  },
  headerTintColor: colors.ink,
  headerTitleStyle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.ink,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
  animation: 'slide_from_right' as const,
  contentStyle: { backgroundColor: colors.surface1 },
}
