import auth from './auth.js'

export default function adminAuth(req, res, next) {
  // First run regular auth
  auth(req, res, () => {
    // Then check if user is admin
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Admin access required.' })
    }
    next()
  })
}
