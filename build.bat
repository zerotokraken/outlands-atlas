@echo off
:: echo Installing dependencies...
:: call npm install

echo Building project...
call set NODE_ENV=production
call npm run build

echo Starting server...
call npm start
