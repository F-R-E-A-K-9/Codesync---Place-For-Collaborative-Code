import mongoose, { model, Schema } from "mongoose";

const Roomschema = new Schema({
  roomname: { type: String, required: true },
  roomId: { type: String, required: true, unique: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  content: { type: String },
});

// Compound index: ye ensure karta hai ki same user do baar same naam se room na bana sake
Roomschema.index({ roomname: 1, ownerId: 1 }, { unique: true });

const Roommodel = model("rooms", Roomschema);
export default Roommodel;
