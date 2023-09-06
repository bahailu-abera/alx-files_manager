import { expect } from 'chai';
import redisClient from '../utils/redis';

describe('redis Client', () => {
  it('should return true for isAlive() when connected to Redis', () => {
    expect(redisClient.isAlive()).to.be.true;
  });

  it('should set a key-value pair in Redis and retrieve the value using get()', async () => {
    const key = 'testKey';
    const value = 'testValue';
    const duration = 60; // Duration in seconds

    await redisClient.set(key, value, duration);
    const result = await redisClient.get(key);

    expect(result).to.equal(value);
  });

  it('should delete a key from Redis using del()', async () => {
    const key = 'testKey';
    const value = 'testValue';
    const duration = 60; // Duration in seconds

    await redisClient.set(key, value, duration);
    await redisClient.del(key);
    const result = await redisClient.get(key);

    expect(result).to.be.null;
  });
});
