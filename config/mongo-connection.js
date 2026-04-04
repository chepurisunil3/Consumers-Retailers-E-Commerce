const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const MONGODB_URI =
  process.env.MongoDBURI ||
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/rect-with-node";

let isConnected = false;

const connectToMongoDB = async () => {
  if (isConnected) {
    return mongoose.connection;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log(`Connected to MongoDB at ${MONGODB_URI}`);
    return mongoose.connection;
  } catch (error) {
    console.error("Unable to connect to MongoDB", error);
    process.exit(1);
  }
};

module.exports = connectToMongoDB;
