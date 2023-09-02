import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static getStatus(_, res) {
    res.send({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
  }

  static getStats(_, res) {
    res.send({ users: dbClient.nbUsers(), files: dbClient.nbFiles() });
  }
}

module.exports = AppController;
