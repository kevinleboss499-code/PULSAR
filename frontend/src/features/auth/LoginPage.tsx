/* Connexion — même scène spatiale que la landing (étoiles + limbe). */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { Icon, Logo, ThemeToggle, useTheme } from "@/components/ui";
import { motion as M } from "@/design/tokens";
import { LangToggle, useLang } from "@/i18n";
import { useAuth } from "./AuthProvider";
import { normalizeId } from "./authService";
import { AuthError, type AuthErrorCode } from "./types";
import { homeFor, roleFromId } from "./roles";
import { SpaceFilm } from "@/features/landing/SpaceFilm";
import { BleConnect } from "@/features/ble/BleConnect";
import { hasWebBluetooth } from "@/features/ble/gatt";
import { radioStatus } from "@/features/ble/radio";
import { useBleReading } from "@/features/ble/store";
import "@/features/landing/landing.css";

export function LoginPage() {
  const { user, login } = useAuth();
  const { theme } = useTheme();
  const { t } = useLang();
  const L = t.login;
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string; loggedOut?: boolean } };
  const calm = useReducedMotion();
  const [id, setId] = useState("");
  const [code, setCode] = useState("");
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<{ code: AuthErrorCode; msg: string } | null>(null);
  const [mustBle, setMustBle] = useState(false);
  const ble = useBleReading();
  const idRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  useEffect(() => { document.title = L.titleDoc; }, [L.titleDoc]);
  useEffect(() => {
    let live = true;
    radioStatus().then((ok) => { if (live) setMustBle(ok || hasWebBluetooth()); });
    return () => { live = false; };
  }, []);
  const bleLocked = mustBle && !ble;

  if (user && !pending) return <Navigate to={homeFor(user.role)} replace />;

  const badId = err && ["EMPTY", "BAD_FORMAT", "UNKNOWN_ID"].includes(err.code) && (err.code !== "EMPTY" || !id.trim());
  const badCode = err && (err.code === "BAD_CODE" || (err.code === "EMPTY" && !code.trim()));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setPending(true);
    try {
      const u = await login(id, code);
      const from = loc.state?.from;
      nav(from && from.startsWith(homeFor(u.role)) ? from : homeFor(u.role), { replace: true });
    } catch (x) {
      const a = x instanceof AuthError ? x : new AuthError("NETWORK", "Connexion impossible. Réessayez.");
      setErr({ code: a.code, msg: a.message }); setPending(false);
      (a.code === "BAD_CODE" ? codeRef : idRef).current?.focus();
    }
  }

  const guessed = id ? roleFromId(normalizeId(id)) : null;

  return (
    <div className="login">
      <motion.div
        key={theme}
        className="lp-theme-flash"
        initial={calm ? false : { opacity: 0.35 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.45, ease: M.easeOut }}
        aria-hidden="true"
      />
      <figure className="login-photo login-photo--film">
        <SpaceFilm variant="panel" interactive={!calm} cycle credit={false} />
      </figure>
      <div className="login-side">
        <div className="login-top">
          <Link to="/" aria-label={L.back}>
            <Logo size={36} />
          </Link>
          <span className="login-top-r">
            <LangToggle />
            <ThemeToggle />
          </span>
        </div>
        <main id="main" className="login-main">
          <Link className="btn btn-ghost sm login-back" to="/">
            <Icon name="arrow_back" size={16} /> {L.back}
          </Link>
          <h1 style={{ whiteSpace: "pre-line" }}>{L.h1}</h1>
          <p className="lead">{L.lead}</p>
          <p className="login-ble-ask">{L.bleBefore}</p>
          <BleConnect />
          {loc.state?.loggedOut && (
            <p className="hint" role="status"><Icon name="check_circle" size={18} /> {L.loggedOut}</p>
          )}
          <form className="login-form" noValidate aria-label={L.submit} onSubmit={submit}>
            <fieldset className="login-fields" disabled={bleLocked}>
            <div className="field">
              <label htmlFor="login-id">{L.idLabel}</label>
              <input
                ref={idRef}
                id="login-id"
                name="identifier"
                value={id}
                placeholder="ex. AST-000"
                autoComplete="username"
                autoCapitalize="characters"
                spellCheck={false}
                aria-invalid={!!badId}
                aria-describedby={err ? "login-error" : (guessed ? "login-id-help" : undefined)}
                onChange={(e) => { setId(e.target.value); if (err) setErr(null); }}
                onBlur={() => setId((v) => normalizeId(v))}
              />
              {guessed && (
                <small id="login-id-help" className="field-help">
                  {L.idHelp(t.roles[guessed])}
                </small>
              )}
            </div>
            <div className="field">
              <label htmlFor="login-code">{L.codeLabel}</label>
              <div className="field-pass">
                <input
                  ref={codeRef}
                  id="login-code"
                  name="code"
                  value={code}
                  type={show ? "text" : "password"}
                  inputMode="numeric"
                  autoComplete="current-password"
                  placeholder="••••••"
                  aria-invalid={!!badCode}
                  aria-describedby={err ? "login-error" : undefined}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); if (err) setErr(null); }}
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? L.hide : L.show}
                  aria-pressed={show}
                >
                  <Icon name={show ? "visibility_off" : "visibility"} />
                </button>
              </div>
            </div>
            <AnimatePresence initial={false}>
              {err && (
                <motion.p
                  key="login-error"
                  className="form-error"
                  id="login-error"
                  role="alert"
                  data-code={err.code}
                  initial={calm ? false : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: M.fast }}
                >
                  <Icon name={err.code === "LOCKED" ? "lock" : "error"} size={18} /> {err.msg}
                </motion.p>
              )}
            </AnimatePresence>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={pending || err?.code === "LOCKED"}
              aria-busy={pending}
            >
              {pending ? (<><Icon name="sync" className="spin" /> {L.submitting}</>) : (<>{L.submit} <Icon name="arrow_forward" /></>)}
            </button>
            </fieldset>
          </form>
        </main>
      </div>
    </div>
  );
}
