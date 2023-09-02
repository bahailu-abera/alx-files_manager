import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static getStatus(_, res) {
    res.status(200).json({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
  }

  static getStats(_, res) {
    const usersCount = dbClient.nbUsers();
    const filesCount = dbClient.nbFiles();

    Promise.all([usersCount, filesCount])
      .then(([users, files]) => {
        res.status(200).json({ users, files });
      })
      .catch((error) => {
        console.error(error);
        res.status(500).json({ error: 'Internal server error ' });
      });
  }
}

module.exports = AppController;
