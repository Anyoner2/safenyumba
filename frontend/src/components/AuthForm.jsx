import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { loginAccount, registerAccount } from '../api.js'
import { useAuth } from '../auth.jsx'

function AuthForm({ mode }) {
  const isRegister = mode === 'register'
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const form = new FormData(event.currentTarget)
    const credentials = {
      email: form.get('email'),
      password: form.get('password'),
    }

    if (isRegister) {
      const confirmPassword = String(form.get('confirm_password') || '')
      if (credentials.password !== confirmPassword) {
        setError('Passwords do not match.')
        setSubmitting(false)
        return
      }
    }

    try {
      const result = isRegister
        ? await registerAccount({ ...credentials, full_name: form.get('name'), confirm_password: form.get('confirm_password') })
        : await loginAccount(credentials)
      signIn(result.token, result.user)
      navigate(location.state?.from || '/', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-page">
      <div
        className="auth-art"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85')" }}
      >
        <div className="auth-art-copy">
          <span className="eyebrow">A good move starts here</span>
          <h1>{isRegister ? 'Make room for what’s next.' : 'Welcome back home.'}</h1>
          <p>Find verified places and connect with the people who know them best.</p>
        </div>
      </div>
      <div className="auth-form-side">
        <form className="auth-form" onSubmit={handleSubmit}>
          <span className="eyebrow">Safe Nyumba account</span>
          <h2>{isRegister ? 'Create your account' : 'Login'}</h2>
          <p className="auth-subtitle">
            {isRegister ? 'Save homes, request viewings, or manage your property portfolio.' : 'Sign in to continue your house search.'}
          </p>
          {isRegister && (
            <div className="form-field">
              <label htmlFor="full-name">Full name</label>
              <input id="full-name" name="name" autoComplete="name" required />
            </div>
          )}
          <div className="form-field">
            <label htmlFor="email-address">Email address</label>
            <input id="email-address" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength="8" required />
          </div>
          {isRegister && (
            <div className="form-field">
              <label htmlFor="confirm-password">Confirm password</label>
              <input
                id="confirm-password"
                name="confirm_password"
                type="password"
                autoComplete="new-password"
                minLength="8"
                required
              />
            </div>
          )}
          <button className="button form-submit" type="submit" disabled={submitting}>
            {submitting ? 'Please wait...' : isRegister ? 'Create account' : 'Login'}
          </button>
          {error && <p className="form-message" role="alert">{error}</p>}
          <p className="auth-switch">
            {isRegister ? 'Already have an account? ' : 'New to Safe Nyumba? '}
            <Link to={isRegister ? '/login/' : '/register/'}>{isRegister ? 'Login' : 'Create an account'}</Link>
          </p>
        </form>
      </div>
    </section>
  )
}

export default AuthForm