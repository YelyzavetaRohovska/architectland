export const post = async (event) => {
  console.log("eventBody: ", typeof event.body);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Go Serverless v4.0! Your function executed successfully!",
    }),
  };
};
