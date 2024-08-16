import pg from 'pg';

import DbService from './dbService';
import ApiError from '../utils/apiError';

interface IDbPostgresConfig {
  user: string;
  host: string;
  database: string;
  password: string;
  port: number;
}

export default class DbPostgresService extends DbService {
  client: pg.Client;

  constructor(config: IDbPostgresConfig) {
    super();
    this.client = new pg.Client(config);
  }

  async connect() {
    try {
      console.log("Connecting to PostgreSQL...");
      await this.client.connect();
      console.log("Connected to PostgreSQL");
    } catch (err) {
      throw new ApiError(500, 'Failed to connect to PostgreSQL');
    }
  }

  async end() {
    try {
      console.log("Disconnecting from PostgreSQL...");
      await this.client.end();
      console.log("Disconnected from PostgreSQL");
    } catch (err) {
      throw new ApiError(500, 'Failed to disconnect from PostgreSQL');
    }
  }
}
