import { expect } from 'chai';
import dbClient from '../utils/db';

describe('dB Client', () => {
  it('should return true for isAlive() when connected to MongoDB', () => {
    expect(dbClient.isAlive()).to.be.true;
  });

  it('should retrieve the number of users from MongoDB using nbUsers()', async () => {
    const result = await dbClient.nbUsers();
    expect(result).to.be.a('number');
    // Add more specific assertions based on your application's expectations
  });

  it('should retrieve the number of files from MongoDB using nbFiles()', async () => {
    const result = await dbClient.nbFiles();
    expect(result).to.be.a('number');
    // Add more specific assertions based on your application's expectations
  });
});
