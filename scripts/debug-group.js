const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load env vars manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.join('=').trim();
    }
});

const MONGODB_URI = envVars.MONGODB_URI || process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable');
    process.exit(1);
}

const GroupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    leetcodeUsername: String,
});

const Group = mongoose.models.Group || mongoose.model('Group', GroupSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function inspect() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const groupName = "Dhurandar's Elite"; // from screenshot
        const group = await Group.findOne({ name: groupName });

        if (!group) {
            console.log(`Group "${groupName}" not found!`);
            // List all groups
            const groups = await Group.find({});
            console.log('Available groups:', groups.map(g => g.name));
            return;
        }

        console.log('Found Group:', group.name);
        console.log('Group ID:', group._id);
        console.log('Group Members (Raw):', group.members);
        console.log('Group Member Types:', group.members.map(m => typeof m));

        // Try finding members
        const members = await User.find({ _id: { $in: group.members } });
        console.log(`Found ${members.length} members in User collection`);
        members.forEach(m => console.log(`- ${m.name} (${m._id})`));

        if (members.length === 0 && group.members.length > 0) {
            console.log('WARNING: Mismatch between Group members array and User collection.');
            console.log('Checking first member ID specifically...');
            const firstId = group.members[0];
            const user = await User.findById(firstId);
            console.log(`Direct lookup for ${firstId}:`, user ? 'Found' : 'Not Found');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
