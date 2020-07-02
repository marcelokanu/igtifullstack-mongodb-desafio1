import accountModel from '../models/AccountModel.js';
import { formatMoney, formatDate } from '../helpers/index.js';

const draftFee = 1;
const transferFee = 8;
const privateAgencyNumber = 99;

export async function listAllAccounts(req, res) {
  await accountModel.find((err, accounts) => {
    if (err) {
      return res.status(400).json(err);
    }
    return res.status(202).json(accounts);
  });
}

export async function createAccount(req, res) {
  const { agencia, name, conta, balance } = req.body;

  const accountFind = await accountModel.findOne({ agencia, conta });
  if (accountFind) {
    return res
      .status(406)
      .json({ result: `Conta já em uso. Cliente: ${accountFind.name}` });
  }

  const accountCreated = await accountModel.create(
    { agencia, conta, name, balance },
    (err, account) => {
      if (err) {
        return res.status(500).json(err);
      }
      res.status(201).json({
        _id: account._id,
        agencia: account.agencia,
        conta: account.conta,
        name: account.name,
        balance: formatMoney(account.balance),
        date: formatDate(new Date()),
      });
    }
  );
}

export async function income(req, res) {
  const { agencia, conta, value } = req.body;
  if (value <= 0) {
    return res.status(406).json({
      result: `Valor inválido: ${formatMoney(value)}`,
    });
  }

  const findAccount = await accountModel.findOne({ agencia, conta });
  if (!findAccount) {
    return res.status(404).json({
      result: `Conta não existe. Agência: ${agencia}, Conta corrente: ${conta}`,
    });
  }

  try {
    const accountIncome = await accountModel.findOneAndUpdate(
      { agencia, conta },
      { $inc: { balance: value } },
      { new: true, runValidators: true }
    );
    res.status(202).json({
      _id: accountIncome._id,
      agencia: accountIncome.agencia,
      conta: accountIncome.conta,
      name: accountIncome.name,
      balance: formatMoney(accountIncome.balance),
      date: formatDate(new Date()),
    });
  } catch (error) {
    res.status(500).json(error);
  }
}

export async function outcome(req, res) {
  const { agencia, conta, value } = req.body;

  if (value <= 0) {
    return res.status(406).json({
      result: `Valor inválido: ${formatMoney(value)}`,
    });
  }

  const findAccount = await accountModel.findOne({ agencia, conta });
  if (!findAccount) {
    return res.status(404).json({
      result: `Conta não existe. Agência: ${agencia}, Conta corrente: ${conta}`,
    });
  }

  const draftWithFee = value + draftFee;

  if (findAccount.balance - draftWithFee < 0) {
    return res.status(406).json({
      result: 'Saldo insuficiente.',
      saldo: formatMoney(findAccount.balance),
      depósito: formatMoney(draftWithFee),
    });
  }

  try {
    const accountOutcome = await accountModel.findOneAndUpdate(
      { agencia, conta },
      { $inc: { balance: -draftWithFee } },
      { new: true, runValidators: true }
    );
    res.status(202).json({
      _id: accountOutcome._id,
      agencia: accountOutcome.agencia,
      conta: accountOutcome.conta,
      name: accountOutcome.name,
      saqueComTarifa: formatMoney(draftWithFee),
      saldo: formatMoney(accountOutcome.balance),
      data: formatDate(new Date()),
    });
  } catch (error) {
    res.status(500).json(error);
  }
}

export async function viewAccount(req, res) {
  const { agencia, conta } = req.body;

  const findAccount = await accountModel.findOne({ agencia, conta });
  if (!findAccount) {
    return res.status(404).json({
      result: `Conta não existe. Agência: ${agencia}, Conta corrente: ${conta}`,
    });
  }
  await accountModel.findOne({ agencia, conta }, (err, account) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.status(202).json({
      saldo: formatMoney(account.balance),
      agencia: account.agencia,
      conta: account.conta,
      name: account.name,
      date: formatDate(new Date()),
    });
  });
}

export async function deleteAccount(req, res) {
  const { agencia, conta } = req.body;

  const findAccount = await accountModel.findOne({ agencia, conta });
  if (!findAccount) {
    return res.status(404).json({
      result: `Conta não existe. Agência: ${agencia}, Conta corrente: ${conta}`,
    });
  }

  await accountModel.deleteOne({ agencia, conta }, (err, account) => {
    if (err) {
      return res.status(500).json(err);
    }

    const contasAtivas = accountModel.find({ agencia }, (err, accounts) => {
      if (err) {
        return res.status(500).json(err);
      }
      res.status(202).json({
        result: `A conta ${conta} de ${findAccount.name} foi excluida com sucesso`,
        agencia,
        qtdeAtivas: accounts.length,
        contasAtivas: accounts,
      });
    });
  });
}

export async function transferBetweenAccounts(req, res) {
  const { ccOrigem, ccDestino, value } = req.body;

  if (value <= 0) {
    return res.status(406).json({
      result: `Valor inválido: ${formatMoney(value)}`,
    });
  }

  let source, destiny;

  await accountModel.find(
    { conta: { $in: [ccOrigem, ccDestino] } },
    (err, contas) => {
      if (err) {
        return res.status(500).json(err);
      }
      if (contas.length !== 2) {
        return res.status(404).json({
          result: 'Conta não existe.',
          accountNotFound: contas[0].conta === ccOrigem ? ccDestino : ccOrigem,
        });
      }

      source = contas[0].conta === ccOrigem ? contas[0] : contas[1];
      destiny = contas[1].conta === ccDestino ? contas[1] : contas[0];

      let transferValue = 0;

      source.agencia !== destiny.agencia
        ? (transferValue = value + transferFee)
        : (transferValue = value);

      if (source.balance - transferValue < 0) {
        return res.status(406).json({
          result: 'Saldo insuficiente.',
          saldo: formatMoney(source.balance),
          valor_transferência: formatMoney(transferValue),
        });
      }
      source.balance -= transferValue;
      destiny.balance += value;
    }
  );

  await accountModel.updateOne(
    { conta: source.conta },
    { $set: { balance: source.balance } }
  );
  await accountModel.updateOne(
    { conta: destiny.conta },
    { $set: { balance: destiny.balance } }
  );

  res.status(202).json({ date: formatDate(new Date()), source, destiny });
}

export async function averageBalance(req, res) {
  const agency = req.params.agency;

  const findAgency = await accountModel.findOne({ agencia: Number(agency) });
  if (!findAgency) {
    return res.status(404).json({
      result: `Agência não existe. Agência: ${agency}`,
    });
  }

  const averageAgency = await accountModel.aggregate([
    { $match: { agencia: Number(agency) } },
    {
      $group: {
        _id: null,
        avgBalance: { $avg: '$balance' },
      },
    },
  ]);

  res
    .status(202)
    .json({ agency, media: formatMoney(averageAgency[0].avgBalance) });
}

export async function minorBalance(req, res) {
  const limit = req.params.limit;

  if (!limit || limit < 0) {
    return res.status(406).json({
      result: `Informe um valor válido para limit: ${limit}`,
    });
  }

  const accounts = await accountModel.aggregate([
    { $sort: { balance: 1 } },
    { $limit: Number(limit) },
  ]);

  res.status(202).json(accounts);
}

export async function majorBalance(req, res) {
  const limit = req.params.limit;

  if (!limit || limit < 0) {
    return res.status(406).json({
      result: `Informe um valor válido para limit: ${limit}`,
    });
  }

  const accounts = await accountModel.aggregate([
    { $sort: { balance: -1 } },
    { $limit: Number(limit) },
  ]);

  res.status(202).json(accounts);
}

export async function agencyPrivate(req, res) {
  const accounts = await accountModel.aggregate([
    { $match: { agencia: { $nin: [99] } } },
    { $sort: { balance: -1 } },
    {
      $group: {
        _id: '$agencia',
        agencia_antiga: { $first: '$agencia' },
        conta: { $first: '$conta' },
        balance: { $max: '$balance' },

        name: { $first: '$name' },
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    { $sort: { balance: -1, agencia_antiga: 1 } },
  ]);

  const totalBalance = accounts.reduce((acc, account) => {
    return acc + account.balance;
  }, 0);

  accounts.forEach(async (account) => {
    await accountModel.findOneAndUpdate(
      { conta: account.conta },
      { $set: { agencia: privateAgencyNumber } },
      { new: true, runValidators: true }
    );
  });

  res.status(202).json({
    mediaBalance: formatMoney(totalBalance / accounts.length),
    privateAccounts: accounts,
  });
}
