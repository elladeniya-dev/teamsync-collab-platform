import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { generateToken } from '../utils/generateToken.js';
import { recordAuditLog } from './auditService.js';
import { normalizeRole } from '../middlewares/rbacMiddleware.js';
import { syncUsersWithTeamMembers } from './teamService.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify Google ID Token received from frontend Google Identity Services
 */
export const verifyGoogleIdToken = async (credential) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
  } catch (error) {
    console.error('Google token verification failed:', error.message);
    throw new ApiError(401, 'Invalid or expired Google token');
  }
};

/**
 * Authenticate with Google: Links with existing account if same Gmail, or creates new user
 */
export const googleAuthService = async (credential) => {
  const payload = await verifyGoogleIdToken(credential);

  if (!payload || !payload.email) {
    throw new ApiError(400, 'Unable to extract email from Google token');
  }

  const { email, name, picture, sub: googleId } = payload;
  const normalizedEmail = email.toLowerCase().trim();

  // Check if user already exists with this email
  let user = await User.findOne({ email: normalizedEmail });

  if (user) {
    // Account Linking: Link googleId if not previously attached
    let updated = false;
    if (!user.googleId) {
      user.googleId = googleId;
      user.authProvider = user.password ? 'both' : 'google';
      updated = true;
    }
    if (!user.avatar && picture) {
      user.avatar = picture;
      updated = true;
    }
    if (updated) {
      await user.save();
    }
  } else {
    // New user signing up with Google
    user = await User.create({
      name: name || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      avatar: picture || '',
      googleId: googleId,
      authProvider: 'google',
    });
  }

  const token = generateToken(user._id);

  // Record audit log
  await recordAuditLog({
    actor: { id: user._id, name: user.name, email: user.email, role: user.role },
    action: user.isNew ? 'AUTH_REGISTER' : 'AUTH_LOGIN',
    resourceType: 'Auth',
    resourceId: String(user._id),
    details: { method: 'Google OAuth', email: user.email },
    status: 'SUCCESS',
  });

  // Ensure user is synchronized into TeamMember collection
  await syncUsersWithTeamMembers();

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      authProvider: user.authProvider,
      role: user.role,
    },
    token,
  };
};

/**
 * Manual Email/Password Registration
 */
export const registerUserService = async ({ name, email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const userExists = await User.findOne({ email: normalizedEmail });
  if (userExists) {
    throw new ApiError(400, 'An account with this email address already exists');
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    authProvider: 'local',
  });

  const token = generateToken(user._id);

  // Record audit log
  await recordAuditLog({
    actor: { id: user._id, name: user.name, email: user.email, role: user.role },
    action: 'AUTH_REGISTER',
    resourceType: 'Auth',
    resourceId: String(user._id),
    details: { method: 'Local Email/Password', email: user.email },
    status: 'SUCCESS',
  });

  // Ensure user is synchronized into TeamMember collection
  await syncUsersWithTeamMembers();

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      authProvider: user.authProvider,
      role: user.role,
    },
    token,
  };
};

/**
 * Manual Email/Password Login
 */
export const loginUserService = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Retrieve user including password field
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Check if account was registered via Google without a password
  if (!user.password && user.googleId) {
    throw new ApiError(
      400,
      'This account was registered using Google. Please sign in with Google.'
    );
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = generateToken(user._id);

  // Record audit log
  await recordAuditLog({
    actor: { id: user._id, name: user.name, email: user.email, role: user.role },
    action: 'AUTH_LOGIN',
    resourceType: 'Auth',
    resourceId: String(user._id),
    details: { method: 'Local Email/Password', email: user.email },
    status: 'SUCCESS',
  });

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      authProvider: user.authProvider,
      role: user.role,
    },
    token,
  };
};

/**
 * Fetch Current User by ID
 */
export const getMeService = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User session not found');
  }
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    authProvider: user.authProvider,
    role: user.role,
  };
};

/**
 * Get all registered workspace users (Owner / Admin view)
 */
export const getAllUsersService = async () => {
  const users = await User.find({}, 'name email role avatar authProvider createdAt').sort({
    createdAt: 1,
  });
  return users;
};

/**
 * Update a user's workspace role (Owner / Admin privileged)
 */
export const updateUserRoleService = async ({ actor, targetUserId, newRole }) => {
  const normalizedNewRole = normalizeRole(newRole);
  const actorRole = normalizeRole(actor.role);

  // Restrict who can assign roles
  if (actorRole !== 'Owner' && actorRole !== 'Admin') {
    throw new ApiError(403, 'Only Workspace Owners and Admins can modify member roles');
  }

  // Only Owner can assign or modify an Owner
  if (normalizedNewRole === 'Owner' && actorRole !== 'Owner') {
    throw new ApiError(403, 'Only the Workspace Owner can transfer or appoint Owner permissions');
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new ApiError(404, 'Target user not found');
  }

  const oldRole = normalizeRole(targetUser.role);

  if (oldRole === 'Owner' && actorRole !== 'Owner') {
    throw new ApiError(403, 'Only the Workspace Owner can modify an Owner account');
  }

  targetUser.role = normalizedNewRole;
  await targetUser.save();

  // Record immutable audit log
  await recordAuditLog({
    actor,
    action: 'ROLE_CHANGE',
    resourceType: 'User',
    resourceId: String(targetUser._id),
    details: {
      targetUserName: targetUser.name,
      targetUserEmail: targetUser.email,
      previousRole: oldRole,
      newRole: normalizedNewRole,
    },
    status: 'SUCCESS',
  });

  return {
    _id: targetUser._id,
    name: targetUser.name,
    email: targetUser.email,
    role: targetUser.role,
  };
};
