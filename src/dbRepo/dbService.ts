import ApiError from "../utils/apiError";

export default class DbService {
  async connect() {
    throw new ApiError(404, "Method:connect not implemented");
  }

  async fetchItems<Item>(
    tableName: string,
    options: { [key: string]: any }
  ): Promise<Item[]> {
    throw new ApiError(404, "Method:fetchItems not implemented");
  }

  async insertItem(
    tableName: string,
    data: { [columnName: string]: any },
    options?: { [key: string]: any }
  ): Promise<{
    rows: any[];
    rowCount: number;
    command: string;
  }> {
    throw new ApiError(404, "Method:insertItem not implemented");
  }

  format(values: { [columnName: string]: any }) {
    throw new ApiError(404, "Method:format not implemented");
  }

  async end() {
    throw new ApiError(404, "Method:end not implemented");
  }
}
