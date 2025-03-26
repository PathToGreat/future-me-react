import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200EE',
    accent: '#03DAC6',
    background: '#f7f7f7',
    surface: '#FFFFFF',
    text: '#000000',
    error: '#B00020',
    success: '#4CAF50',
    warning: '#FF9800',
    info: '#2196F3',
    disabled: '#BDBDBD',
    placeholder: '#9E9E9E',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.1)',
    habitComplete: '#4CAF50',
    habitIncomplete: '#BDBDBD',
    habitInProgress: '#FFA000',
  },
  roundness: 8,
  animation: {
    scale: 1.0,
  },
  fonts: {
    ...DefaultTheme.fonts,
    thin: {
      fontFamily: 'System',
      fontWeight: '100',
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300',
    },
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700',
    },
  },
};
