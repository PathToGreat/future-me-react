/**
 * Web-specific polyfills for React Native Web
 * This file adds compatibility for React Native features on the web platform
 */

// Import core polyfills
import 'react-native-web/dist/modules/UnimplementedView';

// Global variable to identify web platform
global.IS_WEB_PLATFORM = true;

// Handle platform-specific features
if (typeof window !== 'undefined') {
  // Add any web-specific polyfills here
  window.requestAnimationFrame = window.requestAnimationFrame || function(callback) {
    setTimeout(callback, 0);
  };
  
  // Mock vibration API if not available
  if (!window.navigator.vibrate) {
    window.navigator.vibrate = () => true;
  }
}

// Console log for debugging
console.log('Web polyfills loaded for React Native Web compatibility');