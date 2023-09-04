import express from 'express';
import routes from './routes';

const port = process.env.PORT || 5000;
const app = express();

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb' }));

app.use('/', routes);

app.listen(port, () => {
  console.log(`App listining at port ${port}.`);
});
