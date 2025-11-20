export function analyzeTrends(snapshots) {
  if (!snapshots || snapshots.length === 0) {
    console.log('⚖️ Stable: no historical data available');
    return {
      trendScore: 0,
      direction: 'stable',
      description: 'No historical data',
      changePercentage: 0
    };
  }

  if (snapshots.length === 1) {
    console.log('⚖️ Stable: minimal change (only one data point)');
    return {
      trendScore: 0,
      direction: 'stable',
      description: 'Insufficient data for trend',
      changePercentage: 0
    };
  }

  const sortedSnapshots = [...snapshots].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  const firstScore = sortedSnapshots[0].lifestyleScore;
  const lastScore = sortedSnapshots[sortedSnapshots.length - 1].lifestyleScore;
  
  const changePercentage = ((lastScore - firstScore) / firstScore) * 100;
  
  const scores = sortedSnapshots.map(s => s.lifestyleScore);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  let trendSlope = 0;
  for (let i = 0; i < scores.length - 1; i++) {
    trendSlope += (scores[i + 1] - scores[i]);
  }
  trendSlope = trendSlope / (scores.length - 1);

  const trendScore = trendSlope * 10;
  
  let direction = 'stable';
  let description = 'Minimal change';
  
  if (changePercentage > 3) {
    direction = 'improving';
    description = 'Positive lifestyle trend';
    console.log(`📈 Trend detected: improving (Score: +${changePercentage.toFixed(1)}%)`);
  } else if (changePercentage < -3) {
    direction = 'declining';
    description = 'Negative lifestyle trend';
    console.log(`📉 Trend detected: declining (Score: ${changePercentage.toFixed(1)}%)`);
  } else {
    console.log(`⚖️ Stable: minimal change (${changePercentage.toFixed(1)}%)`);
  }

  console.log('📊 Trend Analysis Results:');
  console.log(`  - Data Points: ${snapshots.length} days`);
  console.log(`  - First Score: ${firstScore.toFixed(1)}`);
  console.log(`  - Last Score: ${lastScore.toFixed(1)}`);
  console.log(`  - Average Score: ${avgScore.toFixed(1)}`);
  console.log(`  - Trend Slope: ${trendSlope.toFixed(2)} points/day`);
  console.log(`  - Direction: ${direction}`);

  return {
    trendScore,
    trendSlope,
    direction,
    description,
    changePercentage: parseFloat(changePercentage.toFixed(1)),
    avgScore: parseFloat(avgScore.toFixed(1)),
    dataPoints: snapshots.length
  };
}

export function getMetricTrend(snapshots, metric) {
  if (!snapshots || snapshots.length < 2) {
    return { direction: 'stable', change: 0 };
  }

  const sortedSnapshots = [...snapshots].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  const values = sortedSnapshots.map(s => s[metric]);
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  
  const change = lastValue - firstValue;
  const direction = change > 0.3 ? 'improving' : change < -0.3 ? 'declining' : 'stable';
  
  return { direction, change: parseFloat(change.toFixed(2)) };
}
