import mongoose from 'mongoose';

export interface IGroup {
    _id: mongoose.Types.ObjectId;
    name: string;
    code: string;
    description?: string;
    members: mongoose.Types.ObjectId[];
    owner: mongoose.Types.ObjectId;
    createdAt: Date;
}

const GroupSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, required: false },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
});

// Check if the model exists and delete it to prevent overwrite warning in dev
if (process.env.NODE_ENV === 'development') {
    if (mongoose.models.Group) {
        delete mongoose.models.Group;
    }
}

export const Group = mongoose.models.Group || mongoose.model('Group', GroupSchema);
