import { createBrowserRouter, Navigate } from "react-router-dom";
import DefaultLayout from "./pages/DefaultLayout";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminGuard from "./pages/admin/AdminGuard";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import LandingPage from './pages/landing/LandingPage';
import LandingEnhanced from './pages/landing/LandingEnhanced';
import TracksPage from "./pages/tracks/TracksPage";
import TrackDetail from "./pages/tracks/TrackDetail";
import CommitteePage from "./pages/committee/CommitteePage";
import SubmitIdea from "./pages/submit/SubmitIdea";
import LoginPage from "./pages/login/LoginPage";
import SignupPage from "./pages/login/SignupPage";
import AccountPage from "./pages/AccountPage";
import NewIdea from "./pages/ideas/NewIdea";
import IdeaDetail from "./pages/ideas/IdeaDetail";
import IdeaEdit from "./pages/ideas/IdeaEdit";
import IdeaExport from "./pages/ideas/IdeaExport";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminIdeas from "./pages/admin/Ideas";
import AdminUsers from "./pages/admin/Users";
import AdminAssignments from "./pages/admin/Assignments";
import AdminJudges from "./pages/admin/Judges";
import AppProvidersShell from "./components/layouts/AppProvidersShell";
import JudgeLoginPage from "./pages/judge/JudgeLoginPage";
import JudgeDashboard from "./pages/judge/JudgeDashboard";
import JudgeGuard from "./pages/judge/JudgeGuard";
import JudgeLayout from "./pages/judge/JudgeLayout";
import JudgeCreatePage from "./pages/admin/judges/JudgeCreatePage";
import JudgeAssignPage from "./pages/admin/judges/JudgeAssignPage";
import AdminProjectsPage from "./pages/admin/projects/AdminProjectsPage";
import ProjectsRankingPage from "./pages/admin/projects/ProjectsRankingPage";
import FileViewer from "./pages/admin/FileViewer";

export const router = createBrowserRouter([
  { element: <AppProvidersShell />, // ✅ AuthProvider now lives under the Router
    children: [
    {
    path: "/",
    element: <DefaultLayout />, // you can keep <ScrollRestoration /> inside this layout now
    children: [
      { index: true, element: <LandingEnhanced /> },
      { path: 'landing-old', element: <LandingPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
      { path: "committee", element: <CommitteePage /> },
      { path: "tracks", element: <TracksPage /> },
      { path: "tracks/:slug", element: <TrackDetail /> },
      { path: "submit", element: <SubmitIdea /> },
      { path: "account", element: <AccountPage /> },
      { path: "ideas/new", element: <NewIdea /> },
      { path: "ideas/:id", element: <IdeaDetail /> },
      { path: "ideas/:id/edit", element: <IdeaEdit /> },
      { path: "ideas/:id/export", element: <IdeaExport /> },
    ],
  },
  { path: "/panel/judge/login", element: <JudgeLoginPage /> },
  {
    path: "/panel/judge",
    element: (
      <JudgeGuard>
        <JudgeLayout />
      </JudgeGuard>
    ),
    children: [
      { index: true, element: <JudgeDashboard /> },
    ],
  },
  {
    path: "/panel/judge/*",
    element: <Navigate to="/panel/judge" replace />,
  },
  {
    path: "/panel/admin",
    element: (
      <AdminGuard>
        <AdminLayout />
      </AdminGuard>
    ),
    errorElement: <div>Admin route error</div>,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "ideas", element: <AdminIdeas /> },
      { path: "users", element: <AdminUsers /> },
      { path: "assignments", element: <AdminAssignments /> },
      { path: "judges", element: <AdminJudges /> },
      { path: "judges/create", element: <JudgeCreatePage /> },
      { path: "judges/:judgeId/assign", element: <JudgeAssignPage /> },
      { path: "projects", element: <AdminProjectsPage /> },
      { path: "ranking", element: <ProjectsRankingPage /> },
      { path: "file-viewer", element: <FileViewer /> },
      // … other admin routes
    ],
  },
  { path: "/panel/admin/login", element: <AdminLoginPage /> },
  { path: "*", element: <div>Not Found</div> },],}
]);
