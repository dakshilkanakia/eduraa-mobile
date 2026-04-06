import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { stackScreenOptions } from './shared'
import StudentExamsScreen from '../screens/exams/StudentExamsScreen'
import ExamDetailScreen from '../screens/exams/ExamDetailScreen'

export type StudentExamsStackParamList = {
  StudentExamsList: undefined
  ExamDetail: { examId: string; examName: string }
}

const Stack = createNativeStackNavigator<StudentExamsStackParamList>()

export default function StudentExamsNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="StudentExamsList" component={StudentExamsScreen} options={{ title: 'My Exams' }} />
      <Stack.Screen name="ExamDetail" component={ExamDetailScreen} options={({ route }) => ({ title: route.params.examName })} />
    </Stack.Navigator>
  )
}
