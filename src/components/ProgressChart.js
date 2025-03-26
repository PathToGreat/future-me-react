import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme } from 'victory-native';
import { getHabitById, getHabitLogs } from '../services/habitService';
import { getLastWeekDates } from '../utils/habitUtils';

const { width } = Dimensions.get('window');

const ProgressChart = ({ habitId, userId, refreshKey = 0 }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get the dates for the last 7 days
        const weekDates = getLastWeekDates();
        
        let logs = {};
        
        // If habitId is provided, get logs for a specific habit
        // Otherwise, get all habits for the user's daily dashboard
        if (habitId) {
          const habit = await getHabitById(userId, habitId);
          logs = habit.logs || {};
        } else {
          logs = await getHabitLogs(userId);
        }
        
        // Process the data for the chart
        const data = weekDates.map(date => {
          const dateString = date.dateString;
          
          // For a specific habit, check if the habit was completed on this date
          if (habitId) {
            return {
              date: date.label,
              completed: logs[dateString] && logs[dateString].completed ? 1 : 0,
              color: logs[dateString] && logs[dateString].completed 
                ? theme.colors.primary 
                : theme.colors.disabled
            };
          } 
          // For the dashboard, calculate completion percentage across all habits
          else {
            const dayLogs = logs[dateString] || [];
            const totalHabits = dayLogs.length;
            const completedHabits = dayLogs.filter(log => log.completed).length;
            
            const completionRate = totalHabits > 0 
              ? completedHabits / totalHabits 
              : 0;
            
            return {
              date: date.label,
              completed: completionRate,
              color: getColorForRate(completionRate, theme)
            };
          }
        });
        
        setChartData(data);
      } catch (error) {
        console.error('Error loading chart data:', error);
        // Set empty data on error
        setChartData(getLastWeekDates().map(date => ({
          date: date.label,
          completed: 0,
          color: theme.colors.disabled
        })));
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [habitId, userId, refreshKey]);
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading data...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <VictoryChart
        width={width - 40}
        height={220}
        domainPadding={20}
        theme={VictoryTheme.material}
        padding={{ top: 20, bottom: 40, left: 40, right: 20 }}
      >
        <VictoryAxis
          tickFormat={(tick) => tick}
          style={{
            tickLabels: { fontSize: 10, padding: 5 }
          }}
        />
        <VictoryAxis
          dependentAxis
          domain={[0, habitId ? 1 : 1]}
          tickFormat={(tick) => habitId ? (tick === 1 ? 'Done' : 'Not Done') : `${Math.round(tick * 100)}%`}
          style={{
            tickLabels: { fontSize: 10, padding: 5 }
          }}
        />
        <VictoryBar
          data={chartData}
          x="date"
          y="completed"
          cornerRadius={4}
          barWidth={30}
          style={{
            data: {
              fill: ({ datum }) => datum.color
            }
          }}
          animate={{
            duration: 500,
            onLoad: { duration: 300 }
          }}
        />
      </VictoryChart>
    </View>
  );
};

// Helper function to get color based on completion rate
const getColorForRate = (rate, theme) => {
  if (rate >= 0.7) return theme.colors.success;
  if (rate >= 0.4) return theme.colors.warning;
  if (rate > 0) return theme.colors.error;
  return theme.colors.disabled;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
});

export default ProgressChart;
