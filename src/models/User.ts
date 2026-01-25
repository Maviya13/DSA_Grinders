import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  leetcodeUsername: string;
  github: string;
  linkedin?: string;
  phoneNumber?: string; // Optional phone number for WhatsApp
  groups: mongoose.Types.ObjectId[];
  role: 'user' | 'admin';
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  leetcodeUsername: { type: String, required: true, unique: true },
  github: { type: String, required: true }, // GitHub profile is mandatory
  linkedin: { type: String, required: false }, // LinkedIn profile is optional
  phoneNumber: { type: String, required: false }, // Optional phone number for WhatsApp
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
});

// Hash password before saving
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if the model exists and delete it to prevent overwrite warning in dev
if (process.env.NODE_ENV === 'development') {
  if (mongoose.models.User) {
    delete mongoose.models.User;
  }
}

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
