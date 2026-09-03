import "server-only";
import mongoose, { type Mongoose } from "mongoose";
import { getDatabaseConfig, isDatabaseConfigured } from "@/config/env";
import { ConfigurationError, DatabaseError } from "@/lib/errors";

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

const globalForMongoose = globalThis as unknown as {
  __kisanVyaparMongooseCache?: MongooseCache;
};

const cache: MongooseCache =
  globalForMongoose.__kisanVyaparMongooseCache ??
  (globalForMongoose.__kisanVyaparMongooseCache = { conn: null, promise: null });

export async function connectToDatabase(): Promise<Mongoose> {
  if (cache.conn) {
    return cache.conn;
  }

  if (!isDatabaseConfigured()) {
    throw new ConfigurationError(
      "MONGODB_URI is not configured. Copy .env.example to .env.local and set MONGODB_URI.",
    );
  }

  const config = getDatabaseConfig();

  if (!cache.promise) {
    cache.promise = mongoose.connect(config.uri, { dbName: config.name });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw new DatabaseError("Failed to connect to the database.", { cause: error });
  }

  return cache.conn;
}

export interface DatabasePing {
  ok: boolean;
  message: string;
}

export async function pingDatabase(): Promise<DatabasePing> {
  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      message: "MONGODB_URI is not configured on this server.",
    };
  }

  try {
    const connection = await connectToDatabase();
    await connection.connection.db?.admin().command({ ping: 1 });
    return { ok: true, message: "Connected to MongoDB." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unknown database error.",
    };
  }
}
