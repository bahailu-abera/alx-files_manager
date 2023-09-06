import Queue from 'bull';
import auth from '../utils/auth';
import dbClient from '../utils/db';
import sha1Hash from '../utils/utils';

const userQueue = new Queue('userQueue');

class UsersController {
  /* eslint-disable-next-line */
  static createUser(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    dbClient.client.db().collection('users')
      .findOne({ email })
    /* eslint-disable-next-line */
      .then((existingUser) => {
        if (existingUser) {
          return res.status(400).json({ error: 'Already exist' });
        }

        // Hash the password using SHA1
        const hashedPassword = sha1Hash(password);

        // Create the new user document
        const newUser = { email, password: hashedPassword };

        // Save the new user in the database
        dbClient.client.db().collection('users')
          .insertOne(newUser)
          .then((result) => {
            const { insertedId } = result;
            const { email } = newUser;

            userQueue.add({ userId: insertedId });

            return res.status(201).json({ id: insertedId, email });
          })
          .catch((error) => {
            console.error(error);

            return res.status(500).json({ error: 'Internal server error' });
          });
      })
      .catch((error) => {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
      });
  }

  static async getMe(req, res) {
    const user = await auth.getUserFromToken(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { _id, email } = user;

    return res.status(200).json({ id: _id, email });
  }
}

module.exports = UsersController;
