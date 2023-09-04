import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';

import { join } from 'path';
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import dbClient from '../utils/db';
import auth from '../utils/auth';

function valideType(type) {
  const acceptedTypes = ['folder', 'image', 'file'];

  return acceptedTypes.includes(type);
}

class FilesController {
  static async postUpload(req, res) {
    const user = await auth.getUserFromToken(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !valideType(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }

    const parentFile = await dbClient.client
      .db()
      .collection('files')
      .findOne({ _id: new ObjectId(parentId) });

    if (parentId !== 0 && !parentFile) {
      return res.status(400).json({ error: 'Parent not found' });
    }

    if (parentId !== 0 && parentFile.type !== 'folder') {
      return res.status(400).json({ error: 'Parent is not a folder' });
    }

    const userId = user._id;

    const file = {
      userId,
      name,
      type,
      isPublic,
      parentId,
    };

    if (type === 'folder') {
      const result = await dbClient.client.db().collection('files').insertOne({ ...file });

      const newFile = { id: result.insertedId, ...file };

      return res.status(200).json({ ...newFile });
    }

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';

    if (!existsSync(folderPath)) {
      mkdirSync(folderPath, { recursive: true });
    }

    const filePath = join(folderPath, `${uuidv4()}`);

    const fileStream = createWriteStream(filePath, { encoding: 'base64' });
    const decodedData = Buffer.from(data, 'base64');
    fileStream.write(decodedData);
    fileStream.end();

    file.parentId = new ObjectId(file.parentId);

    file.localPath = filePath;

    const result = await dbClient.client
      .db()
      .collection('files')
      .insertOne(file);

    return res.status(201).json({
      id: result.insertedId, userId, name, type, isPublic, parentId,
    });
  }

  static async getShow(req, res) {
    const { id } = req.params;

    const user = await auth.getUserFromToken(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.client.db().collection('files')
      .findOne(
        { _id: new ObjectId(id), userId: user._id },
        { projection: { localPath: 0 } },
      );

    if (!file) {
      return res.status(400).json({ error: 'Not found' });
    }

    return res.status(200).json({ ...file });
  }

  static async getIndex(req, res) {
    const user = await auth.getUserFromToken(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parentId = req.query.parentId || 0;
    const page = parseInt(req.query.page, 10) || 0;
    const limit = 20;
    const skip = page * limit;

    const files = await dbClient.client.db().collection('files').aggregate([
      {
        $match: {
          userId: user._id,
          parentId,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $project: { localPath: 0 }, // Exclude localPath from the projected fields
      },
    ]).toArray();

    return res.status(200).json(files);
  }
}

module.exports = FilesController;
