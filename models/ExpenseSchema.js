const mongoose = require("mongoose");
const schema = mongoose.Schema;

const ExpenseSchema =new schema({
    description: String,
    amount: Number,
    paidBy: String,
    splits: [{ person: String, amount: Number }],
    createdAt: { type: Date, default: Date.now },
    category: {
    type: String,
            enum: ["Food", "Travel", "Utilities", "Entertainment", "Other"],
            default: "Other",
        },
    recurring: {
            type: Boolean,
        default: false,
    },
        frequency: {
            type: String,
            enum: ["monthly", "weekly"],
            default: null,
        },

})

const expense = mongoose.model("Expense" , ExpenseSchema);
module.exports = expense;