import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't return password in queries by default
    },
    avatar: {
      type: String,
      default: '',
    },
    googleId: {
      type: String,
      sparse: true,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'both'],
      default: 'local',
    },
    role: {
      type: String,
      enum: ['Owner', 'Admin', 'Member', 'Guest', 'admin', 'member'],
      default: 'Member',
    },
  },
  {
    timestamps: true,
  }
);

// Normalize role capitalization and automatically grant Owner to first registered user
userSchema.pre('save', async function (next) {
  if (this.role) {
    if (this.role.toLowerCase() === 'owner') this.role = 'Owner';
    else if (this.role.toLowerCase() === 'admin') this.role = 'Admin';
    else if (this.role.toLowerCase() === 'guest') this.role = 'Guest';
    else this.role = 'Member';
  }

  // If first user in system, automatically promote to Owner
  if (this.isNew) {
    try {
      const userCount = await mongoose.models.User.countDocuments();
      if (userCount === 0) {
        this.role = 'Owner';
      }
    } catch {
      // Fallback to default if count check fails
    }
  }

  next();
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
