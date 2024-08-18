# Welcome to Architectland!

The app represents a simple REST API with the following features:
  - Retrieve building limit data
  - Insert building limit data, split by plateau elevation

## Test the deployed version

### GET
| Param       | Type        |
| ----------- | ----------- |
| limit       | `number`      |

Request:
```sh
curl https://puh1ke3jyk.execute-api.eu-north-1.amazonaws.com/dev/buildingLimits?limit=10 \
  -X GET
```
Expected result:
```json
[
  {
    buildingLimit: geoJSON,
    heightPlateaus: geoJSON,
    splitedBuildingLimits: geoJSON
  },
  ...
]
```

### POST

See https://datatracker.ietf.org/doc/html/rfc7946#page-12 for more info regarding geoJSON objects.

| Body            | Type        |
| --------------- | ----------- |
| building_limits | `FeatureCollection<Polygon>`
| heigh_plateaus  | `FeatureCollection<Polygon>`


Request:
```sh
curl https://puh1ke3jyk.execute-api.eu-north-1.amazonaws.com/dev/buildingLimits/calculate \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{"building_limits": <geoJSON>, "height_plateaus": <geoJSON>}'
```
Expected result:
```json
{
  buildingLimit: geoJSON,
  heightPlateaus: geoJSON,
  splitedBuildingLimits: geoJSON
}
```

## Development

Start locally:
```sh
git clone https://github.com/YelyzavetaRohovska/architectland.git
npm install
npm run sls:dev
```

Deploy:
```sh
npm run sls:deploy
```

Testing:
```sh
npm run test
```

## Decisions

  - Serverless AWS cloud solution
  - API Gateway
  - Postgress with PostGIS extension
  - Request schema validation
  - Turfjs library to simplify logic
  - Embed concurency/security by lambda function
  - Unit tests using vitest
  - Custom error handling
  - httpWrapper to handle connection and incoming data
  - Environment variables to store secrets
  - TypeScript for comfortable development process
