const Twilio = require('twilio');
const AccessToken = Twilio.jwt.AccessToken;
const VideoGrant   = AccessToken.VideoGrant;

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_API_KEY_SID,
  TWILIO_API_KEY_SECRET
} = process.env;

// Initialize Twilio REST client (for room management)
const client = Twilio(TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SECRET);

// 1️⃣ Generate a Video access token
exports.getToken = async (req, res) => {
  const { identity, room } = req.body;
  try {
    const token = new AccessToken(
      TWILIO_ACCOUNT_SID,
      TWILIO_API_KEY_SID,
      TWILIO_API_KEY_SECRET,
      { ttl: 3600 }
    );
    token.identity = identity;
    token.addGrant(new VideoGrant({ room }));
    return res.status(200).json({ token: token.toJwt() });
  } catch (err) {
    console.error('Twilio token error:', err);
    return res.status(500).json({ msg: 'Could not generate token' });
  }
};

// 2️⃣ Create a new room (admins/providers only)
exports.createRoom = async (req, res) => {
  const { uniqueName } = req.body;
  try {
    const room = await client.video.rooms.create({ uniqueName });
    return res.status(201).json(room);
  } catch (err) {
    console.error('Twilio room creation error:', err);
    return res.status(500).json({ msg: 'Could not create room' });
  }
};

// 3️⃣ (Optional) List recent rooms
exports.listRooms = async (req, res) => {
  try {
    const rooms = await client.video.rooms.list({ limit: 20 });
    return res.status(200).json(rooms);
  } catch (err) {
    console.error('Twilio list rooms error:', err);
    return res.status(500).json({ msg: 'Could not list rooms' });
  }
};
