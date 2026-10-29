import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { generateToken } from '../utils/generateToken.js';

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
