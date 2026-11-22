/**
 * File: src/App.tsx
 * Description: Root Application component hosting the portal router.
 */

import React from 'react';
import AppRouter from './routes/AppRouter';

export const App: React.FC = () => {
  return <AppRouter />;
};

export default App;
