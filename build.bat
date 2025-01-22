@echo off
:: echo Installing dependencies...
:: call npm install

echo Building project...
call npx tsc
call npx webpack

echo Starting server...
call npx serve dist
