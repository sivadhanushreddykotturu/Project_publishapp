import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import AuthConfigurationScreen from './integration/AuthConfigurationScreen';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App renderAuthScreen={(props) => <AuthConfigurationScreen isDarkMode={props.isDarkMode} onBackToHome={props.onBackToHome} />} />
  </StrictMode>,
);
