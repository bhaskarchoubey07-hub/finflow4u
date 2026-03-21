import Header from "../../components/Header";
import AuthForm from "../../components/AuthForm";

export default function LoginPage() {
  return (
    <main>
      <Header />
      <section className="auth-shell">
        <AuthForm mode="login" />
      </section>
    </main>
  );
}
