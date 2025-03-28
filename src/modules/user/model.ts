import mongoose, { model } from "mongoose";
export interface IUser {
  username: string;
  password: string;
  email: string;
  fullName: string;
  image?: string;
}

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minLength: 3,
      maxLength: 20,
    },
    image: {
      type: String,
      maxLength: 200,
    },
    password: {
      type: String,
      required: true,
      minLength: 6,
      maxLength: 200,
    },
    salt: {
      type: String,
      minLength: 6,
      maxLength: 200,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      minLength: 5,
      maxLength: 50,
    },
    fullName: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 50,
    },
  },
  { timestamps: true, versionKey: false }
);
// userSchema.pre("save", function (next) {
//   if (this.isModified("password")) {
//     const { salt, hash } = hashPassword(this.password);
//     this.salt = salt;
//     this.password = hash;
//   }
//   next();
// });

const User = model("User", userSchema);
export default User;
