import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import PasswordReset from './pages/PasswordReset/PasswordReset';
import DiagnosisWizard from './pages/Diagnosis/DiagnosisWizard';
import DiagnosisResult from './pages/Diagnosis/DiagnosisResult';
import TeachingStyles from './pages/TeachingStyles/TeachingStyles';
import StyleDetail from './pages/TeachingStyles/StyleDetail';
import StyleComparison from './pages/TeachingStyles/StyleComparison';
import Templates from './pages/Templates/Templates';
import CreateTemplate from './pages/Templates/CreateTemplate';
import TemplateDetail from './pages/Templates/TemplateDetail';
import EditTemplate from './pages/Templates/EditTemplate';
import Analytics from './pages/Analytics/Analytics';

// Material-UIテーマの設定
const theme = createTheme({
  palette: {
    primary: {
      main: '#2c3e50',
    },
    secondary: {
      main: '#3498db',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              
              {/* 公開ルート */}
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="password-reset" element={<PasswordReset />} />
              
              {/* 認証が必要なルート */}
              <Route
                path="diagnosis"
                element={
                  <PrivateRoute>
                    <DiagnosisWizard />
                  </PrivateRoute>
                }
              />
              <Route
                path="diagnosis/result/:id"
                element={
                  <PrivateRoute>
                    <DiagnosisResult />
                  </PrivateRoute>
                }
              />
              <Route
                path="templates"
                element={
                  <PrivateRoute>
                    <Templates />
                  </PrivateRoute>
                }
              />
              <Route
                path="templates/new"
                element={
                  <PrivateRoute>
                    <CreateTemplate />
                  </PrivateRoute>
                }
              />
              <Route
                path="templates/:id"
                element={
                  <PrivateRoute>
                    <TemplateDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="templates/edit/:id"
                element={
                  <PrivateRoute>
                    <EditTemplate />
                  </PrivateRoute>
                }
              />
              <Route
                path="styles"
                element={
                  <PrivateRoute>
                    <TeachingStyles />
                  </PrivateRoute>
                }
              />
              <Route
                path="styles/:id"
                element={
                  <PrivateRoute>
                    <StyleDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="styles/compare"
                element={
                  <PrivateRoute>
                    <StyleComparison />
                  </PrivateRoute>
                }
              />
              <Route
                path="analytics"
                element={
                  <PrivateRoute>
                    <Analytics />
                  </PrivateRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <PrivateRoute>
                    <div>プロフィールページ（未実装）</div>
                  </PrivateRoute>
                }
              />
            </Route>
            
            {/* 404ページ */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
