import { useState } from 'react'
import { Link } from 'react-router-dom'

function AuthForm({ mode }) {
  const isRegister = mode === 'register'
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
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
            {isRegister ? 'Save homes and arrange viewings in one place.' : 'Sign in to continue your house search.'}
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
          <button className="button form-submit" type="submit">{isRegister ? 'Create account' : 'Login'}</button>
          {submitted && <p className="form-message" role="status">Account access will be connected when the Safe Nyumba backend is ready.</p>}
          <p className="auth-switch">
            {isRegister ? 'Already have an account? ' : 'New to Safe Nyumba? '}
            <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Login' : 'Create an account'}</Link>
          </p>
        </form>
      </div>
    </section>
  )
}

export default AuthForm