const AWS = require("aws-sdk");
const shortid = require("shortid");

exports.handler = async event => {
  // Pull proxy path, request method and body from event
  let {
    requestContext: {
      http: { method }
    },
    pathParameters: { proxy },
    body
  } = event;

  if (method === "GET" && proxy === "") {
    return getRoot();
  }

  if (method === "POST" && proxy === "bins") {
    return postNewBin(body);
  }

  const binURLMatch = proxy.match(/^bins\/([A-Za-z0-9\-_]+)/);
  const binId = binURLMatch ? binURLMatch[1] : null;

  if (method === "GET" && binId) {
    return getBin(binId);
  }

  if (method === "PUT" && binId) {
    return putBin(binId, body);
  }

  if (method === "DELETE" && binId) {
    return deleteBin(binId);
  }
};

function getRoot() {
  return {
    statusCode: 200,
    body: JSON.stringify("Welcome to OurJSON API v2.0.0")
  };
}

async function postNewBin(body) {
  try {
    // This only loops as long as we've accidentally generated a colliding name
    while (true) {
      // Generate ID
      let binId = shortid.generate();

      try {
        await new AWS.DynamoDB()
          .putItem({
            TableName: "mused-storage",
            Item: {
              binId: { S: binId },
              json: { M: AWS.DynamoDB.Converter.marshall(JSON.parse(body)) }
            },
            ConditionExpression: "attribute_not_exists(binId)"
          })
          .promise();

        return {
          statusCode: 201,
          headers: {
            "Bin-ID": binId,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            uri: `https://api.musedlab.org/bins/${binId}`
          })
        };
      } catch (error) {
        if (error.name !== "ConditionalCheckFailedException") {
          // Some error other than a name collision. Rethrow error
          throw error;
        }
      }
    }
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
}

async function getBin(binId) {
  try {
    let response = await new AWS.DynamoDB()
      .getItem({
        TableName: "mused-storage",
        Key: { binId: { S: binId } }
      })
      .promise();

    if ("Item" in response) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(
          AWS.DynamoDB.Converter.unmarshall(response.Item.json.M)
        )
      };
    } else {
      return {
        statusCode: 404,
        body: `We could not find a bin with the ID (${binId}) in our system`
      };
    }
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
}

async function putBin(binId, body) {
  try {
    await new AWS.DynamoDB()
      .putItem({
        TableName: "mused-storage",
        Item: {
          binId: { S: binId },
          json: { M: AWS.DynamoDB.Converter.marshall(JSON.parse(body)) }
        },
        ConditionExpression: "attribute_exists(binId)"
      })
      .promise();

    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body
    };
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      return {
        statusCode: 404,
        body: `We could not find a bin with the ID (${binId}) in our system`
      };
    } else {
      return { statusCode: 500, body: error.toString() };
    }
  }
}

async function deleteBin(binId) {
  try {
    await new AWS.DynamoDB()
      .deleteItem({
        TableName: "mused-storage",
        Key: { binId: { S: binId } }
      })
      .promise();

    return {
      statusCode: 200,
      body: "Bin (" + binId + ") has been deleted."
    };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
}
