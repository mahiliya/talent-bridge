// Central, tiny auth helpers. The app's existing convention is that a valid
// session is represented by an `accessToken` in localStorage (set by the
// Login/Signup modals), so we reuse that rather than introducing a parallel
// auth system.

export const getAccessToken = () => localStorage.getItem('accessToken');

export const isAuthenticated = () => Boolean(localStorage.getItem('accessToken'));

// Role is derived from which session object the login flow stored. Companies
// store a `company` object; users store a `user` object.
export const getRole = () => {
  if (localStorage.getItem('company')) return 'company';
  if (localStorage.getItem('user')) return 'user';
  return null;
};

// The browsing surface authenticated visitors are sent to.
export const BROWSE_PATH = '/internships';

export const clearSession = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('company');
};
