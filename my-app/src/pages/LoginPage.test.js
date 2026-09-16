import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../auth/AuthContext";
import { ProtectedRoute } from "../auth/ProtectedRoute";
import { HomePage } from "./HomePage";
import { LoginPage } from "./LoginPage";

function renderLoginApp() {
  return render(
    <AuthProvider>
      <MemoryRouter
        initialEntries={["/login"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

test("shows an error for invalid credentials", async () => {
  renderLoginApp();

  await userEvent.type(screen.getByLabelText(/e-mail/i), "errado@circulabook.com");
  await userEvent.type(screen.getByLabelText(/senha/i), "senhaerrada");
  await userEvent.click(screen.getByRole("button", { name: /entrar/i }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "E-mail ou senha inválidos."
  );
});

test("logs in with mocked credentials and shows the header", async () => {
  renderLoginApp();

  await userEvent.type(screen.getByLabelText(/e-mail/i), "marcelo@circulabook.com");
  await userEvent.type(screen.getByLabelText(/senha/i), "123456");
  await userEvent.click(screen.getByRole("button", { name: /entrar/i }));

  expect(await screen.findByText(/ana souza - usuário da comunidade/i)).toBeInTheDocument();
  expect(screen.getByText(/buscar livros/i)).toBeInTheDocument();
});

test("sign up button does not navigate", async () => {
  renderLoginApp();

  await userEvent.click(screen.getByRole("button", { name: /cadastre-se/i }));

  expect(screen.getByRole("heading", { name: /entrar na rede/i })).toBeInTheDocument();
});
