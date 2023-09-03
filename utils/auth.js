import { ObjectId } from 'mongodb';
import dbClient from './db';
import sha1Hash from './utils';
import redisClient from './redis';

class Auth {
  static async getUserFromAuthorization(req) {
    const authHeader = req.headers.authorization || null;

    if (!authHeader) {
      return null;
    }

    const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');

    const email = auth[0];
    const password = auth[1];

    const user = await dbClient.client.db().collection('users').findOne({ email });

    if (!user || sha1Hash(password) !== user.password) {
      return null;
    }

    return user;
  }

  static async getUserFromToken(req) {
    const token = req.headers['x-token'];

    if (!token) {
      return null;
    }

    try {
      const userId = await redisClient.get(`auth_${token}`);

      const user = await dbClient.client
        .db()
        .collection('users')
        .findOne({ _id: new ObjectId(userId) });

      return user || null;
    } catch (error) {
      // Handle the promise rejection here
      console.error('Error retrieving user from token:', error);
      return null;
    }
  }
}

export default Auth;
