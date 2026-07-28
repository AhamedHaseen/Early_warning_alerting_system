import { supabase } from '../config/supabase.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized - No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token using Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized - Invalid token' });
    }

    // Attach user to request object
    req.user = user;
    
    // Optionally fetch extended user details from public.users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (!profileError && userProfile) {
      req.user.role = userProfile.role;
      req.user.firstName = userProfile.first_name;
      req.user.lastName = userProfile.last_name;
    }

    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error during authentication' });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ status: 'error', message: 'Forbidden - Insufficient permissions' });
    }
    next();
  };
};
