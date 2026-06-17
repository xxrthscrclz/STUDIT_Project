import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { PrivateRoute } from '@/routes/privateRoute';
import MainPage from '@/pages/main';
import LoginPage from '@/pages/login';
import SignupPage from '@/pages/signup';
import RoomsPage from '@/pages/rooms';
import RoomDetailPage from '@/pages/rooms/detail';
import ReservationCreatePage from '@/pages/reservations/create';
import MyReservationsPage from '@/pages/reservations';
import TimetablePage from '@/pages/timetable';
import TimetableAddPage from '@/pages/timetable/add';
import RecommendPage from '@/pages/timetable/recommend';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<MainPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="rooms/:roomId" element={<RoomDetailPage />} />
          <Route
            path="reservations/create/:seatId"
            element={
              <PrivateRoute>
                <ReservationCreatePage />
              </PrivateRoute>
            }
          />
          <Route
            path="reservations"
            element={
              <PrivateRoute>
                <MyReservationsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="timetable"
            element={
              <PrivateRoute>
                <TimetablePage />
              </PrivateRoute>
            }
          />
          <Route
            path="timetable/add"
            element={
              <PrivateRoute>
                <TimetableAddPage />
              </PrivateRoute>
            }
          />
          <Route
            path="timetable/recommend"
            element={
              <PrivateRoute>
                <RecommendPage />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
