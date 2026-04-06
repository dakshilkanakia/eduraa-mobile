import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { stackScreenOptions } from './shared'
import TeacherExamsScreen from '../screens/teacher/TeacherExamsScreen'
import CreateExamScreen from '../screens/teacher/CreateExamScreen'
import TeacherExamDetailScreen from '../screens/teacher/TeacherExamDetailScreen'

export type TeacherExamsStackParamList = {
  TeacherExamsList: undefined
  CreateExam: undefined
  TeacherExamDetail: { examId: string }
}

const Stack = createNativeStackNavigator<TeacherExamsStackParamList>()

export default function TeacherExamsNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="TeacherExamsList" component={TeacherExamsScreen} options={{ title: 'My Exams' }} />
      <Stack.Screen name="CreateExam" component={CreateExamScreen} options={{ title: 'New Exam' }} />
      <Stack.Screen name="TeacherExamDetail" component={TeacherExamDetailScreen} options={{ title: 'Exam Details' }} />
    </Stack.Navigator>
  )
}
