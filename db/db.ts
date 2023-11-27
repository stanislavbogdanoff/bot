import mongoose from "mongoose";

export const connectDB = async (connectionString: string) => {
  try {
    mongoose.connect(connectionString);
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
