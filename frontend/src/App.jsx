import { Routes, Route, Outlet } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import EventTypes from './pages/Dashboard/EventTypes';
import Availability from './pages/Dashboard/Availability';
import Meetings from './pages/Dashboard/Meetings';
import BookingPage from './pages/PublicBooking/BookingPage';
import ConfirmationPage from './pages/PublicBooking/ConfirmationPage';

function DashboardLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Dashboard Routes */}
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<EventTypes />} />
        <Route path="availability" element={<Availability />} />
        <Route path="meetings" element={<Meetings />} />
      </Route>

      {/* Public Booking Routes */}
      <Route path="/:username/:slug" element={<BookingPage />} />
      <Route path="/:username/:slug/success" element={<ConfirmationPage />} />
    </Routes>
  );
}

export default App;
