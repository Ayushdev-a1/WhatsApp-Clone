const mongoose = require("mongoose")
const crypto = require("crypto")

const messageSchema = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    senderID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    file: { type: String },
    message: {
      type: String,
      validate: {
        validator: function (v) {
          return v || this.file
        },
        message: "Message is required if no file is provided",
      },
    },
  },
  {
    timestamps: true,
  },
)

// messageSchema.methods.encryptContent = function (content) {
//   const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
//   let encrypted = cipher.update(content, 'utf8', 'hex');
//   encrypted += cipher.final('hex');
//   return encrypted;
// };

// messageSchema.methods.decryptContent = function (content) {
//   const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
//   let decrypted = decipher.update(content, 'hex', 'utf8');
//   decrypted += decipher.final('utf8');
//   return decrypted;
// };

// messageSchema.pre('save', function (next) {
//   this.content = this.encryptContent(this.content);
//   next();
// });

const Message = mongoose.model("Message", messageSchema)

module.exports = Message

