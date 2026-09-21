import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";
const connectionOptions = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
  socketTimeoutMS: 10000,
  maxPoolSize: 10,
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongoose?: {
    connection: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
    unavailableUntil?: number;
  };
};

const cached = globalForMongoose.mongoose ?? {
  connection: null,
  promise: null,
};

globalForMongoose.mongoose = cached;

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    return null;
  }

  if (cached.unavailableUntil && cached.unavailableUntil > Date.now()) {
    return null;
  }

  if (cached.connection) {
    return cached.connection;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, connectionOptions).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.connection = await cached.promise;
  } catch {
    cached.promise = null;
    cached.connection = null;
    cached.unavailableUntil = Date.now() + 15000;
    console.warn("MongoDB unavailable; using the local fallback temporarily.");
    return null;
  }

  cached.unavailableUntil = undefined;
  return cached.connection;
}
