import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from 'react-router-dom';
import './index.css';
import Layout from './layout';
import App from './App';
import DataSheet from './dataSheet';
import { CSVProvider } from './context/CSVContext';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route path="" element={<App />} />
      <Route path="upload" element={<DataSheet />} />
    </Route>
  )
);

// Mounting the app
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CSVProvider>
      <RouterProvider router={router} />
    </CSVProvider>
  </React.StrictMode>
);
