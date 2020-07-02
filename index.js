import 'dotenv/config.js';
import express from 'express';
import routes from './src/routes/accounts.routes.js';
import mongoose from 'mongoose';

(async () => {
  try {
    await mongoose.connect(
      `mongodb+srv://${process.env.USER_DB}:${process.env.PASSWORD_DB}@cluster0-qqm3y.mongodb.net/${process.env.DATABASE_NAME}?retryWrites=true&w=majority`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
      }
    );
    console.log('Conexão com MongoDB estabelecida!!!');
  } catch (error) {
    console.log('Erro de conexão com MongoDB, verifique as credenciais');
  }
})();

const app = express();

app.use(express.json());
app.use(routes);

app.listen(3333, () => console.log('Server started!!!'));
