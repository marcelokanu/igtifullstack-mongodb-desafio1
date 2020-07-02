import express from 'express';
import { formatMoney, formatDate } from '../helpers/index.js';

import accountModel from '../models/AccountModel.js';
import {
  listAllAccounts,
  createAccount,
  income,
  outcome,
  viewAccount,
  deleteAccount,
  transferBetweenAccounts,
  averageBalance,
  minorBalance,
} from '../controllers/AccountController.js';

const app = express.Router();

app.get('/accounts', listAllAccounts);

app.post('/account/create', createAccount);

app.patch('/income', income);

app.patch('/outcome', outcome);

app.get('/account/view', viewAccount);

app.delete('/account/delete', deleteAccount);

app.patch('/account/transfer', transferBetweenAccounts);

app.get('/agency/:agencia', averageBalance);

app.get('/accounts/minor-balance/:limit', minorBalance);

export default app;
