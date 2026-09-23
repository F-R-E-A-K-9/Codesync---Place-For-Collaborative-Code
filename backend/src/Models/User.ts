import mongoose, { model, Schema } from "mongoose";

const Userschema = new Schema({
  name: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const Usermodel = model("users", Userschema);
export default Usermodel;
