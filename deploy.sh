zip -r dist.zip *

aws lambda update-function-code --function-name mused-storage --zip-file fileb://./dist.zip

rm dist.zip