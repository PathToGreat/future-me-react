import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { VictoryLine, VictoryChart, VictoryAxis, VictoryTheme, VictoryLegend } from 'victory-native';
import { getCompletionRate } from '../utils/habitUtils';

const { width } = Dimensions.get('window');

const ProjectionChart = ({ habits, timeFrameDays = 90 }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  
  useEffect(() => {
    const generateProjectionData = () => {
      try {
        setLoading(true);
        
        if (!habits || habits.length === 0) {
          setChartData([]);
          return;
        }
        
        // Calculate current completion rate for all habits
        const completionRates = habits.map(habit => getCompletionRate(habit));
        const avgCompletionRate = completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length;
        
        // Generate projection data for different scenarios
        const currentTrend = [];
        const improvedTrend = [];
        const declinedTrend = [];
        
        // Calculate data points for each week in the timeframe
        const weeksCount = Math.ceil(timeFrameDays / 7);
        const dataPoints = Math.min(10, weeksCount); // Max 10 data points for clarity
        const weekInterval = Math.ceil(weeksCount / dataPoints);
        
        for (let i = 0; i <= dataPoints; i++) {
          const week = i * weekInterval;
          const x = week === 0 ? 'Now' : `Week ${week}`;
          
          // Current trend assumes continuation of current habit performance
          const currentValue = Math.min(100, Math.round(avgCompletionRate * 100));
          
          // Improved trend assumes gradual improvement (max 100%)
          const improvedValue = Math.min(100, Math.round(avgCompletionRate * 100 + (i * 5)));
          
          // Declined trend assumes gradual decline (min 0%)
          const declinedValue = Math.max(0, Math.round(avgCompletionRate * 100 - (i * 3)));
          
          currentTrend.push({ x, y: currentValue });
          improvedTrend.push({ x, y: improvedValue });
          declinedTrend.push({ x, y: declinedValue });
        }
        
        setChartData([
          { name: 'Current Path', data: currentTrend, color: theme.colors.primary },
          { name: 'Improved Habits', data: improvedTrend, color: theme.colors.success },
          { name: 'Declined Habits', data: declinedTrend, color: theme.colors.error }
        ]);
      } catch (error) {
        console.error('Error generating projection data:', error);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };
    
    generateProjectionData();
  }, [habits, timeFrameDays]);
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Generating projection...</Text>
      </View>
    );
  }
  
  if (chartData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Not enough data to generate projection</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <VictoryChart
        width={width - 40}
        height={280}
        theme={VictoryTheme.material}
        domainPadding={20}
        padding={{ top: 40, bottom: 50, left: 60, right: 20 }}
      >
        <VictoryLegend
          x={width / 2 - 150}
          y={10}
          centerTitle
          orientation="horizontal"
          style={{ 
            labels: { fontSize: 10 } 
          }}
          data={chartData.map(line => ({
            name: line.name,
            symbol: { fill: line.color }
          }))}
        />
        <VictoryAxis
          tickFormat={(tick) => tick}
          style={{
            tickLabels: { fontSize: 10, padding: 5, angle: 45, textAnchor: 'start' }
          }}
        />
        <VictoryAxis
          dependentAxis
          domain={[0, 100]}
          tickFormat={(tick) => `${tick}%`}
          style={{
            tickLabels: { fontSize: 10, padding: 5 }
          }}
        />
        {chartData.map((line, index) => (
          <VictoryLine
            key={index}
            data={line.data}
            style={{
              data: { stroke: line.color, strokeWidth: 2 }
            }}
            animate={{
              duration: 1000,
              onLoad: { duration: 500 }
            }}
          />
        ))}
      </VictoryChart>
      
      <Text style={styles.chartDescription}>
        This chart shows possible future outcomes based on your current habit consistency
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  loadingContainer: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
  chartDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 5,
  }
});

export default ProjectionChart;
