import { describe, it, expect, vi, beforeEach } from "vitest";
import pg from "pg";
import DbPostgresService from "../../dbRepo/dbPostgresService";
import ApiError from "../..//utils/apiError";
import { afterEach } from "node:test";

vi.mock("pg", () => {
  const Client = vi.fn();
  Client.prototype.connect = vi.fn();
  Client.prototype.query = vi.fn();
  Client.prototype.end = vi.fn();

  return { default: { Client } };
});


describe("DbPostgresService", () => {
  let mockClient: DbPostgresService;

  beforeEach(() => {
    mockClient = new DbPostgresService({
      user: "user",
      host: "host",
      database: "database",
      password: "password",
      port: 5432,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("connect", () => {
    it("should connect to PostgreSQL", async () => {
      expect(mockClient.connect()).resolves.toBeUndefined();
    });

    it("should throw an ApiError if connection fails", async () => {
      vi.spyOn(pg.Client.prototype, "connect").mockRejectedValueOnce(
        new Error("Failed to connect to PostgreSQL")
      );

      await expect(mockClient.connect()).rejects.toThrowError(
        "Failed to connect to PostgreSQL"
      );
    });
  });

  describe("insertItem", () => {
    it("should insert an item and return the response", async () => {
      const mockResponse = {
        rows: [{ id: 1, name: "Test Item" }],
        rowCount: 1,
        command: "INSERT",
      };

      vi.spyOn(pg.Client.prototype, "query").mockImplementation(() => {
        return Promise.resolve(mockResponse);
      });

      const data = { id: 1, name: "Test Item" };
      const result = await mockClient.insertItem("test_table", data, {
        returning: true,
      });

      expect(pg.Client.prototype.query).toHaveBeenCalledWith(
        "INSERT INTO test_table (id, name) VALUES ($1, $2) RETURNING *",
        ["1", '"Test Item"']
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw an ApiError if insertion fails", async () => {
      vi.spyOn(pg.Client.prototype, "query").mockImplementation(() => {
        new Error("Insertion failed");
      });

      const data = { id: 1, name: "Test Item" };
      await expect(
        mockClient.insertItem("test_table", data)
      ).rejects.toThrowError("Query did not return correct response");
    });
  });

  describe("fetchItems", () => {
    it("should fetch items and return the result", async () => {
      const mockResponse = {
        rows: [{ id: 1, name: "Test Item" }],
        rowCount: 1,
      };

      vi.spyOn(pg.Client.prototype, "query").mockImplementation(() => Promise.resolve(mockResponse));

      const result = await mockClient.fetchItems("test_table", { limit: 10 });

      expect(pg.Client.prototype.query).toHaveBeenCalledWith(
        "SELECT * FROM test_table LIMIT $1",
        [10]
      );
      expect(result).toEqual(mockResponse.rows);
    });

    it("should throw an ApiError if fetching fails", async () => {
      vi.spyOn(pg.Client.prototype, "query").mockImplementation(() => new Error("Fetching failed"));
      await expect(mockClient.fetchItems("test_table")).rejects.toThrowError("Query did not return correct response");
    });
  });

  describe("end", () => {
    it("should disconnect from PostgreSQL", async () => {
      await expect(mockClient.end()).resolves.toBeUndefined();
    });

    it("should throw an ApiError if disconnection fails", async () => {
      vi.spyOn(pg.Client.prototype, "end").mockRejectedValueOnce(
        new Error("Failed to disconnect from PostgreSQL")
      );

      await expect(mockClient.end()).rejects.toThrowError(
        "Failed to disconnect from PostgreSQL"
      );
    });
  });

  describe("format", () => {
    it("should format columns and values correctly", () => {
      const values = { id: 1, name: "Test Item" };
      const result = mockClient.format(values);

      expect(result).toEqual({
        columns: "id, name",
        valuesMapped: "$1, $2",
        values: ["1", '"Test Item"'],
      });
    });
  });
});
