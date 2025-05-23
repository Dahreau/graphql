export function renderLoginView() {
  return `
    <div class="auth">
      <h1>Authentication</h1>
      <form id="auth-form">
        <input type="text" id="username" placeholder="Username" required />
        <input type="password" id="password" placeholder="Password" required />
        <button type="submit">Login</button>
      </form>
    </div>
  `;
}
