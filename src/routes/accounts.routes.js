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
  majorBalance,
  agencyPrivate,
} from '../controllers/AccountController.js';

const app = express.Router();

app.get('/accounts', listAllAccounts);

app.post('/account/create', createAccount);

app.patch('/account/income', income);

app.patch('/account/outcome', outcome);

app.get('/account/view', viewAccount);

app.delete('/account/delete', deleteAccount);

app.patch('/account/transfer', transferBetweenAccounts);

app.get('/agency/:agency', averageBalance);

app.get('/accounts/minor-balance/:limit', minorBalance);

app.get('/accounts/major-balance/:limit', majorBalance);

app.get('/accounts/private', agencyPrivate);

export default app;
