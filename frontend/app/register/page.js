import Header from "../../components/Header";
import AuthForm from "../../components/AuthForm";

export default function RegisterPage() {
  return (
    <main>
      <Header />
      <section className="auth-shell">
        <AuthForm mode="register" />
      </section>
    </main>
  );
}
