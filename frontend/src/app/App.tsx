// import { Routes, Route } from "react-router-dom";
// import { LoginPage } from "./components/LoginPage";
// import { ProtectedRoute } from "./components/ProtectedRoute";
// import { AdminLayout } from "./layouts/AdminLayout";
// import { FacultyLayout } from "./layouts/FacultyLayout";
// import StudentLayout from "./layouts/StudentLayout";

// // Admin Pages
// import { AdminDashboard } from "./components/AdminDashboard";
// import { ManageStudents } from "./components/ManageStudents";
// import { ManageRooms } from "./components/ManageRooms";
// import { ManageExams } from "./components/ManageExams";
// import { ManageFaculty } from "./components/ManageFaculty";
// import { SeatingArrangement } from "./components/SeatingArrangement";
// import { FacultyAllocation } from "./components/FacultyAllocation";
// import { Reports } from "./components/Reports";

// // Student Page
// import  StudentDashboard  from "./components/StudentDashboard";
// import  StudentNotifications from "./components/StudentNotifications";


// // Faculty Dashboard
// import { FacultyDashboard } from "./components/FacultyDashboard";
// import { AttendanceMarking } from "./components/AttendanceMarking";

// //Semester Seating
// import SemesterSeating from "./components/SemesterSeating";

// export default function App() {
//   return (
//     <Routes>
//       {/* Login */}
//       <Route path="/" element={<LoginPage />} />

//       {/* Admin Layout */}
//       <Route
//         path="/admin"
//         element={
//           <ProtectedRoute allowedRole="ADMIN">
//             <AdminLayout />
//           </ProtectedRoute>
//         }
//       >
//         <Route index element={<AdminDashboard />} />
//         <Route path="students" element={<ManageStudents />} />
//         <Route path="manage-faculty" element={<ManageFaculty />} />
//         <Route path="rooms" element={<ManageRooms />} />
//         <Route path="exams" element={<ManageExams />} />
//         <Route path="seating" element={<SeatingArrangement />} />
//         <Route path="faculty" element={<FacultyAllocation />} />
//         <Route path="reports" element={<Reports />} />
//         <Route path="/admin/semester-seating" element={<SemesterSeating />} />
//       </Route>

//       {/* Faculty Dashboard Route (NEW) 
//       <Route
//         path="/faculty"
//         element={
//           <ProtectedRoute allowedRole="FACULTY">
//             <FacultyLayout />
//           </ProtectedRoute>
//         }>
//         <Route index element={<FacultyDashboard />} />
//       </Route>
//       */}

//       {/* Student Layout */}
// <Route
//   path="/student"
//   element={
//     <ProtectedRoute allowedRole="STUDENT">
//       <StudentLayout />
//     </ProtectedRoute>
//   }
// >
//   <Route index element={<StudentDashboard />} />
//   <Route path="notifications" element={<StudentNotifications />} />
// </Route>


//       <Route path="/faculty" element={
//         <ProtectedRoute allowedRole="FACULTY">
//           <FacultyLayout />
//         </ProtectedRoute>
//       }>
//         <Route index element={<FacultyDashboard />} />
//         <Route path="attendance" element={<AttendanceMarking />} />
//       </Route>


//     </Routes>
//   );
// }

import { Routes, Route } from "react-router-dom";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminLayout } from "./layouts/AdminLayout";
import { FacultyLayout } from "./layouts/FacultyLayout";
import StudentLayout from "./layouts/StudentLayout";

// Admin Pages
import { AdminDashboard } from "./components/AdminDashboard";
import { ManageStudents } from "./components/ManageStudents";
import { ManageRooms } from "./components/ManageRooms";
import { ManageExams } from "./components/ManageExams";
import { ManageFaculty } from "./components/ManageFaculty";
import { SeatingArrangement } from "./components/SeatingArrangement";
import { FacultyAllocation } from "./components/FacultyAllocation";
import { Reports } from "./components/Reports";

// Student Page
import StudentDashboard from "./components/StudentDashboard";
import StudentNotifications from "./components/StudentNotifications";


// Faculty Dashboard
import { FacultyDashboard } from "./components/FacultyDashboard";
import { AttendanceMarking } from "./components/AttendanceMarking";

//Semester Seating
import SemesterSeating from "./components/SemesterSeating";

export default function App() {
  return (
    <Routes>
      {/* Login / Register */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Admin Layout */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<ManageStudents />} />
        <Route path="manage-faculty" element={<ManageFaculty />} />
        <Route path="rooms" element={<ManageRooms />} />
        <Route path="exams" element={<ManageExams />} />
        <Route path="seating" element={<SeatingArrangement />} />
        <Route path="faculty" element={<FacultyAllocation />} />
        <Route path="reports" element={<Reports />} />
        <Route path="/admin/semester-seating" element={<SemesterSeating />} />
      </Route>

      {/* Faculty Dashboard Route (NEW) 
      <Route
        path="/faculty"
        element={
          <ProtectedRoute allowedRole="FACULTY">
            <FacultyLayout />
          </ProtectedRoute>
        }>
        <Route index element={<FacultyDashboard />} />
      </Route>
      */}

      {/* Student Layout */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRole="STUDENT">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="notifications" element={<StudentNotifications />} />
      </Route>


      <Route path="/faculty" element={
        <ProtectedRoute allowedRole="FACULTY">
          <FacultyLayout />
        </ProtectedRoute>
      }>
        <Route index element={<FacultyDashboard />} />
        <Route path="attendance" element={<AttendanceMarking />} />
      </Route>


    </Routes>
  );
}