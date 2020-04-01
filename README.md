# ourJSON

MusED Lab's online JSON storage API. Currently implemented in AWS as a Lambda function
that reads and writes data to a DynamoDB table, both named 'mused-storage'.

To deploy a new version of the function (you need to have the AWS command line interface
installed and have permissions to update the function code):

```
npm run deploy
```
