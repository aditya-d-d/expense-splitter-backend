require("dotenv").config();
const express = require('express');
const app = express();
const mongoose = require("mongoose");
const uri = "mongodb+srv://workXadi:aditya123@cluster0.aqtwldg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
const expense = require("./models/ExpenseSchema.js");
const bodyparser  = require("body-parser");
const cron = require('node-cron');

app.use(bodyparser.json());
async function main() {
    mongoose.connect(uri);
}
main().then(() => {
    console.log("connected to DB");
})
.catch((err) => {
    console.log(err);
})
// app.get('/delete' , async(req,res) => {
//     try{
//         const deleted =  await expense.deleteMany({});
//         res.status(200).json(deleted);
//     }
//     catch(err){
//         res.status(500).json({error : "Error occured"});
//     }
// })
//Expense_GET
app.get('/expense' ,async (req,res) => {
    try{
        const expenses = await expense.find({});
        res.status(200).json(expenses);
    }
    catch(err){
        res.status(500).json({error : "Error while fetching data"})
    }
})

//Expense_POST
app.post('/expense', async (req,res) => {
    const {description , amount , paidBy, splits , category , recurring ,frequency} = req.body;

    const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
    if(totalSplit !== amount){
        return res.status(400).json({error : "split amount should equal to sum of all splits"})
    }
    try{
        const Expense = new expense({description , amount , paidBy, splits, category , recurring,frequency});
        await Expense.save();
        res.status(201).json(Expense);
    }
    catch(err){
        res.status(500).json({error : "failed to save expense"})
    }
})

//Expense_EDIT
app.put('/expense/:id' , async(req,res) => {
    const {id} = req.params;
    const {description , amount , paidBy, splits} = req.body;

    try{
        const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
        if (totalSplit !== amount) {
            return res.status(400).json({ error: 'Split amounts must sum up to total amount' });
        }
        const updated = await expense.findByIdAndUpdate(
            id ,
            {description , amount , paidBy, splits},
            { new: true }
        )
        res.status(200).json(updated)
    }
    catch(err){
        res.status(500).json({error : "expense not updated successfully"});
    }
})
//Expense_DELETE
app.delete('/expense/:id' , async(req,res) => {
    const {id} = req.params;
    try{
        const deleted = await expense.findByIdAndDelete(id);
        if(!deleted) res.status(400).json({error : "expense not found"});
        res.status(200).json({error : "Expense deleted successfully"})
    }
    catch(err){
        res.status(500).json({error : "Expense Not deleted"})
    }
})

//people_GET
app.get('/people' ,async(req,res) => {
    try{   
        const expenses = await expense.find({});
        const people = new Set();

        expenses.forEach(exp => {
            people.add(exp.paidBy);
            exp.splits.forEach(split => people.add(split.person));
        })
        res.status(200).json([...people])
    }
    catch(err){
        res.status(500).json({error : "error happened"})
    }
})

//Balances
app.get('/balances' ,async(req,res) => {
    try {
    const expenses = await expense.find();
    const balances = {};

    for (const exp of expenses) {
      const total = exp.amount;
      const payer = exp.paidBy;

      if (!balances[payer]) balances[payer] = 0;
      balances[payer] += total;

      exp.splits.forEach(split => {
        if (!balances[split.person]) balances[split.person] = 0;
        balances[split.person] -= split.amount;
      });
    }

    res.status(200).json(balances);
  } catch (err) {
    res.status(500).json({ error: "Error calculating balances" });
  }
})

app.get('/settlements' ,async (req,res) => {
    try {
    const expenses = await expense.find();
    const balances = {};

    expenses.forEach(exp => {
      const { amount, paidBy, splits } = exp;

      if (!balances[paidBy]) balances[paidBy] = 0;
      balances[paidBy] += amount;

      splits.forEach(split => {
        if (!balances[split.person]) balances[split.person] = 0;
        balances[split.person] -= split.amount;
      });
    });

    const creditors = [], debtors = [];
    Object.entries(balances).forEach(([person, bal]) => {
      if (bal > 0) creditors.push({ person, amount: bal });
      else if (bal < 0) debtors.push({ person, amount: -bal });
    });

    const settlements = [];

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const pay = Math.min(debtors[i].amount, creditors[j].amount);
      settlements.push({
        from: debtors[i].person,
        to: creditors[j].person,
        amount: pay
      });

      debtors[i].amount -= pay;
      creditors[j].amount -= pay;

      if (debtors[i].amount === 0) i++;
      if (creditors[j].amount === 0) j++;
    }

    res.status(200).json(settlements);
  } catch (err) {
    res.status(500).json({ error: "Error calculating settlements" });
  }
})
cron.schedule('0 0 * * *', async () => {
  const today = new Date();

  const recurringExpenses = await expense.find({ recurring: true });

  recurringExpenses.forEach(async (exp) => {
    if (
      (exp.frequency === 'monthly' && today.getDate() === 1) ||
      (exp.frequency === 'weekly' && today.getDay() === 1)
    ) {
      const newExpense = new expense({ ...exp._doc, _id: undefined });
      await newExpense.save();
    }
  });
});
app.get('/categories/summary', async (req, res) => {
  const expenses = await expense.find();
  const summary = {};

  expenses.forEach(exp => {
    const cat = exp.category || 'Other';
    summary[cat] = (summary[cat] || 0) + exp.amount;
  });

  res.status(200).json(summary);
});
app.get('/analytics/monthly', async (req, res) => {
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  const expenses = await expense.find();
  const monthlyTotal = expenses
    .filter(exp => {
      const date = new Date(exp.createdAt);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    })
    .reduce((acc, exp) => acc + exp.amount, 0);

  res.status(200).json({ month: thisMonth + 1, total: monthlyTotal });
});
app.get('/analytics/by-person', async (req, res) => {
  const expenses = await expense.find();
  const result = {};

  expenses.forEach(exp => {
    result[exp.paidBy] = (result[exp.paidBy] || 0) + exp.amount;
  });

  res.status(200).json(result);
});
app.get('/' , (req,res) => {
    res.send("helloooooooo")
})

app.listen('8080' , () => {
    console.log("server is listening");
})