
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import { MobileVoiceClient } from './src/components/MobileVoiceClient';
import { ThemeProvider } from './src/context/ThemeContext';
import { GlobalErrorObserverProvider } from './src/context/GlobalErrorObserverContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { NexusErrorBoundary } from './src/components/NexusErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const isMobileClient = window.location.pathname === '/mobile';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <NotificationProvider>
        <GlobalErrorObserverProvider>
          <NexusErrorBoundary fallbackTitle="N+1 System Fault (Runtime Level)">
            {isMobileClient ? <MobileVoiceClient /> : <App />}
          </NexusErrorBoundary>
        </GlobalErrorObserverProvider>
      </NotificationProvider>
    </ThemeProvider>
  </React.StrictMode>
);
