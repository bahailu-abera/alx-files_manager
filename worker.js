import Queue from 'bull';
import thumbnail from 'image-thumbnail';
import fs from 'fs';
import { ObjectId } from 'mongodb';
import dbClient from './utils/db';

const fileQueue = new Queue('fileQueue');
const userQueue = new Queue('userQueue');

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }

  if (!userId) {
    throw new Error('Missing userId');
  }

  let file;
  try {
    file = await dbClient.client
      .db()
      .collection('files')
      .findOne({ _id: new ObjectId(fileId), userId: new ObjectId(userId) });
  } catch (err) {
    console.log(err);
    return;
  }

  if (!file) {
    throw new Error('File not found');
  }

  const thumbnails = [500, 250, 100];

  for (const width of thumbnails) {
    const thumbnailOptions = { width };

    let thumbnailData;
    try {
      /* eslint-disable-next-line */
      thumbnailData = await thumbnail(file.localPath, thumbnailOptions);
    } catch (err) {
      console.log(err);
    }

    const thumbnailPath = `${file.localPath}_${width}`;

    fs.writeFile(thumbnailPath, thumbnailData, (err) => {
      if (err) {
        console.log(err);
      }
    });
  }
});

userQueue.process(async (job) => {
  const { userId } = job.data;

  if (!userId) {
    throw new Error('Missing userId');
  }

  let user;

  try {
    user = await dbClient.client.db().collection('users').findOne({ _id: new ObjectId(userId) });
  } catch (err) {
    if (err) {
      throw err;
    }
  }

  if (!user) {
    throw new Error('User not found');
  }

  console.log(`welcome our user ${user.email}`);
});
