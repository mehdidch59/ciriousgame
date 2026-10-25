import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
const GameLayout = lazy(() =>
  import("./game/routes").then((module) => ({ default: module.GameLayout })),
);
const Dashboard = lazy(() =>
  import("./game/routes").then((module) => ({ default: module.Dashboard })),
);
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const RequireAuth = lazy(() => import("./components/RequireAuth"));
function App() {
  return (
    <BrowserRouter>
      <a className="skip-link" href="#main-content">
        Aller au contenu principal
      </a>
      <Suspense
        fallback={
          <div className="help-panel" role="status">
            Chargement…
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<RequireAuth />}>
            <Route path="/game" element={<GameLayout />}>
              <Route index element={<Dashboard />} />
            </Route>
          </Route>
          <Route path="*" element={<Home />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
export default App;
