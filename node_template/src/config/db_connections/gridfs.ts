import mongoose from "mongoose";

let gridFSBucket: mongoose.mongo.GridFSBucket | null = null;

export function initGridFS() {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB connection not ready");
  }

  gridFSBucket = new mongoose.mongo.GridFSBucket(db, {
    bucketName: "documents"
  });

  console.log("GridFS initialized");
}


export function getGridFSBucket(): mongoose.mongo.GridFSBucket {
  if (!gridFSBucket) {
    throw new Error("GridFSBucket not initialized");
  }
  return gridFSBucket;
}
