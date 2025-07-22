import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DispatchList from '../components/dispatch/DispatchList';
import CreateDispatch from '../components/dispatch/CreateDispatch';
import DispatchDetail from '../components/dispatch/DispatchDetail';

export default function Dispatches() {
  return (
    <Routes>
      <Route path="/" element={<DispatchList />} />
      <Route path="/nouveau" element={<CreateDispatch />} />
      <Route path="/:id" element={<DispatchDetail />} />
    </Routes>
  );
}