# ourJSON

## API version 1.2.0
- Added a `format` query param on the `/export` endpoint. This endpoint now supports outputting in JSON array format or MongoExport Array format. If not set, the default output will be JSON.

## API version 1.1.1
- Fix to handle `null` objects in arrays

## API version 1.1.0
- Implemented DELETE functionality

To recreate app without rebuilding, run:
```
docker-compose build app
docker-compose up -d --no-deps app
```

else

```
docker-compose up -d
```
