import ApiError from "../utils/apiError";

export default class DbService {
  async connect() {
    throw new ApiError(404, 'Method:connect not implemented');
  }

  async end() {
    throw new ApiError(404, 'Method:end not implemented');
  }
}
