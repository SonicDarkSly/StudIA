import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/theme.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/cards.css';
import './styles/markdown.css';
import './styles/antd.css';
import App from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Élément #root introuvable dans index.html.');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
