import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';

import { join } from 'path';
import {
  createWriteStream, createReadStream, mkdirSync, existsSync,
} from 'fs';
import Queue from 'bull';
import dbClient from '../utils/db';
import auth from '../utils/auth';

const fileQueue = new Queue('fileQueue');

const mime = require('mime-types');

const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';

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

    if (file.parentId !== 0) {
      file.parentId = new ObjectId(file.parentId);
    } else {
      file.parentId = file.parentId.toString();
    }

    if (type === 'folder') {
      const result = await dbClient.client.db().collection('files').insertOne({ ...file });

      const newFile = { id: result.insertedId, ...file };

      if (parentId === 0) {
        newFile.parentId = parseInt(newFile.parentId, 10);
      }

      return res.status(201).json({ ...newFile });
    }

    if (!existsSync(folderPath)) {
      mkdirSync(folderPath, { recursive: true });
    }

    const filePath = join(folderPath, `${uuidv4()}`);

    const fileStream = createWriteStream(filePath, { encoding: 'base64' });
    const decodedData = Buffer.from(data, 'base64');
    fileStream.write(decodedData);
    fileStream.end();

    file.localPath = filePath;

    const result = await dbClient.client
      .db()
      .collection('files')
      .insertOne(file);

    if (file.type === 'image') {
      fileQueue.add({ userId: user._id, fileId: result.insertedId });
    }

    return res.status(201).json({
      id: result.insertedId, userId, name, type, isPublic, parentId,
    });
  }

  static async getShow(req, res) {
    const user = await auth.getUserFromToken(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const file = await dbClient.client.db().collection('files')
      .findOne(
        { _id: new ObjectId(id), userId: user._id },
      );

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (file.parentId === '0') {
      file.parentId = parseInt(file.parentId, 10);
    }

    file.id = file._id;

    delete file._id;
    delete file.localPath;

    return res.status(200).json({ ...file });
  }

  static async getIndex(req, res) {
    const user = await auth.getUserFromToken(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let parentId = req.query.parentId || '0';

    if (parentId !== '0') {
      parentId = new ObjectId(parentId);
    }

    const page = parseInt(req.query.page, 10) || 0;
    const limit = 20;
    const skip = page * limit;

    const files = await dbClient.client.db().collection('files').aggregate([
      {
        $match: {
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

    for (const file of files) {
      file.id = file._id;

      delete file._id;

      if (file.parentId === '0') {
        file.parentId = parseInt(file.parentId, 10);
      }
    }

    return res.status(200).json(files);
  }

  static async updateFilePublicStatus(req, res, isPublic) {
    const user = await auth.getUserFromToken(req);
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.client.db().collection('files')
      .findOne({ _id: new ObjectId(id), userId: user._id });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    await dbClient.client.db().collection('files')
      .updateOne({ _id: new ObjectId(id) }, { $set: { isPublic } });

    file.id = file._id;

    delete file._id;
    delete file.localPath;

    if (file.parentId === '0') {
      file.parentId = parseInt(file.parentId, 10);
    }

    const updatedFile = { ...file, isPublic };

    return res.status(200).json({ ...updatedFile });
  }

  static async putPublish(req, res) {
    return FilesController.updateFilePublicStatus(req, res, true);
  }

  static async putUnpublish(req, res) {
    return FilesController.updateFilePublicStatus(req, res, false);
  }

  static async getFile(req, res) {
    const user = await auth.getUserFromToken(req);
    const { id } = req.params;
    const { size } = req.query.size || '0';

    const file = await dbClient.client.db().collection('files')
      .findOne({ _id: new ObjectId(id) });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (!file.isPublic && (!user || user._id.toString() !== file.userId.toString())) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (file.type === 'folder') {
      return res.status(400).json({ error: 'A folder doesn\'t have content' });
    }

    const filePath = size === '0' ? file.localPath : `${file.localPath}_${size}`;

    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const mimeType = mime.lookup(file.name);
    const fileStream = createReadStream(filePath);

    res.set('Content-Type', mimeType);

    return fileStream.pipe(res);
  }
}

module.exports = FilesController;
