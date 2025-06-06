const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Appointment = require("../models/Appointment");

dotenv.config();

mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("Connected to MongoDB");
  seed();
}).catch(err => {
  console.error("Connection failed:", err);
});

async function seed() {
  try {
    const appointment = new Appointment({
      providerId: "664fbf5d9f2c5a4390a3e78f", // ✅ Use a real provider ID here
      patientName: "John Doe",
      date: new Date(),
      reason: "Routine check-up"
    });

    await appointment.save();
    console.log("✅ Test appointment seeded");
  } catch (err) {
    console.error("❌ Seed error:", err);
  } finally {
    mongoose.disconnect();
  }
}
