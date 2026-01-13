import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
console.log("[DEBUG] Root element found:", rootElement);

if (!rootElement) {
  console.error("[DEBUG] Root element not found!");
  throw new Error("Could not find root element to mount to");
}

console.log("[DEBUG] Creating React Root");
const root = ReactDOM.createRoot(rootElement);
console.log("[DEBUG] Rendering App");
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);