import pg, { QueryResultRow } from 'pg';

import DbService from './dbService';
import ApiError from '../utils/apiError';

interface IDbPostgresConfig {
  user: string;
  host: string;
  database: string;
  password: string;
  port: number;
}

interface IQueryOptions {
  selectedColumns?: { [columnName: string]: boolean };
  returning?: boolean;
  limit?: number;
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
      throw new ApiError(500, "Failed to connect to PostgreSQL");
    }
  }

  async insertItem<R extends QueryResultRow>(tableName: string, data: R, options: IQueryOptions = {}) {
    try {
      const { columns, valuesMapped, values } = this.format(data);
      const query = `INSERT INTO ${tableName} (${columns}) VALUES (${valuesMapped}) ${
        options.returning ? "RETURNING *" : ""
      }`;

      console.log(`Inserting item to the
        - db:${tableName}
        - query: ${query}
      `);

      const resp = await this.client.query<R>(query, values);
      if (!resp?.rows) {
        throw new ApiError(500, "Query did not return correct response");
      }

      console.log(`Successfully inserted ${resp.rowCount} Rows`);
      return {
        rows: resp.rows,
        rowCount: resp.rowCount ?? 0,
        command: resp.command,
      };
    } catch (err: any) {
      throw new ApiError(
        500,
        err?.message || "Failed to insert item to PostgreSQL"
      );
    }
  }

  async fetchItems(tableName: string, options: IQueryOptions = {}) {
    try {
      const selectedField = options.selectedColumns
        ? this.format(options.selectedColumns).columns
        : "*";
      const queryText = `SELECT ${selectedField} FROM ${tableName} LIMIT $1`;

      console.log(
        `Fetching items from the db:${tableName} with query: `,
        queryText
      );
      const resp = await this.client.query(queryText, [options.limit || 100]);

      if (!resp?.rows) {
        throw new ApiError(500, "Query did not return correct response");
      }

      console.log(`Fetched ${resp.rowCount} Rows`);
      return resp.rows;
    } catch (err: any) {
      throw new ApiError(
        500,
        err?.message || "Failed to insert item to PostgreSQL"
      );
    }
  }

  format(values: { [columnName: string]: any }) {
    const columns: string[] = Object.keys(values);

    const columsText = `${columns.join(", ")}`;
    const valuesText = `${columns.map((_, i) => `$${i + 1}`).join(", ")}`;

    return {
      columns: columsText,
      valuesMapped: valuesText,
      values: Object.values(values).map((v) => JSON.stringify(v)),
    };
  }

  async end() {
    try {
      console.log("Disconnecting from PostgreSQL...");
      await this.client.end();
      console.log("Disconnected from PostgreSQL");
    } catch (err) {
      throw new ApiError(500, "Failed to disconnect from PostgreSQL");
    }
  }
}
