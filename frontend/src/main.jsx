import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import dougalIcon from './assets/DougalPixel.png';

// Swap the default Vite favicon for the DougalPixel image and update title
const favicon = document.querySelector("link[rel~='icon']");
if (favicon) {
  favicon.href = dougalIcon;
}
document.title = 'ScabbyQueen';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
