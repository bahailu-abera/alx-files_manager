import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import auth from '../utils/auth';

class AuthController {
  /* eslint-disable-next-line */
  static async getConnect(req, res) {
    const user = await auth.getUserFromAuthorization(req);

    if (user === null) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = uuidv4();
    const key = `auth_${token}`;

    redisClient.set(key, user._id.toString(), 86400)
      .then(() => res.status(200).json({ token }))
      .catch((error) => {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
      });
  }

  static getDisconnect(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;

    redisClient.del(key)
      .then((deletedCount) => {
        if (deletedCount === 0) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        return res.status(204).send();
      })
      .catch(() => res.status(500).json({ error: 'Internal server error' }));
  }
}

export default AuthController;
