import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { stackScreenOptions } from './shared'
import TeacherPapersScreen from '../screens/teacher/TeacherPapersScreen'
import TeacherPaperDetailScreen from '../screens/teacher/TeacherPaperDetailScreen'
import EditPaperScreen from '../screens/teacher/EditPaperScreen'
import GenerateTeacherPaperScreen from '../screens/teacher/GenerateTeacherPaperScreen'

export type TeacherPapersStackParamList = {
  TeacherPapersList: undefined
  GenerateTeacherPaper: undefined
  TeacherPaperDetail: { paperId: string }
  EditPaper: { paperId: string }
}

const Stack = createNativeStackNavigator<TeacherPapersStackParamList>()

export default function TeacherPapersNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="TeacherPapersList" component={TeacherPapersScreen} options={{ title: 'My Papers' }} />
      <Stack.Screen name="GenerateTeacherPaper" component={GenerateTeacherPaperScreen} options={{ title: 'Generate Paper' }} />
      <Stack.Screen name="TeacherPaperDetail" component={TeacherPaperDetailScreen} options={{ title: 'Paper Details' }} />
      <Stack.Screen name="EditPaper" component={EditPaperScreen} options={{ title: 'Edit Paper' }} />
    </Stack.Navigator>
  )
}
