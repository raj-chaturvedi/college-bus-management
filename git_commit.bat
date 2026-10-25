@echo off
set GIT="C:\Users\Acer\Downloads\MinGit\cmd\git.exe"
%GIT% init
%GIT% config user.name "rajchaturvedi215"
%GIT% config user.email "rajchaturvedi215@gmail.com"
%GIT% add .
%GIT% commit -m "Initial commit: College Bus Management System"
%GIT% branch -M main
%GIT% status
