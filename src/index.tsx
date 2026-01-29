import './index.css';
import { Buffer } from 'buffer';
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { DarkModeProvider } from "./contexts/DarkModeContext";

// Polyfill Buffer para navegador (necessário para otplib)
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
  (window as any).global = window;
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Failed to find the root element");
}

const root = createRoot(container);

root.render(
  <DarkModeProvider>
    <App />
  </DarkModeProvider>
);