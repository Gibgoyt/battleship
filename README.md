# TODOS

Pattern up the damned fucking sign up onboarding

## Sign Up Session Fuckup

If user goes to /auth/sign-up to create account
First create account with Firebase
Then store JWT token on browser
Then POST /api/users to create user on our backend

But user gotta:

1. Sign Up Firebase at /auth/sign-in
2. manually go to /auth/sign-in
3. Then finish sign up with auth/sign-up/?firebaseUserExists=true&backendUserExists=false

This needs to be fixed,
and no fixing does not mean a redirect to /auth/sign-in
It should be a single fluid process

## /auth/sign-in and /auth/sign-up look fucked up 

Please fix 

Looks fucked, Firebase SVG logo fucked up
Why the fuck is it even Firebase and not SplitDo logo??
Color scheme like hella fucked so yea

## Buttons On landing page not linked to app

Join presale buttons must take user to app
currently ./src/pages/app/[...all].astro checks for JWT on browser if none then redirect to /auth/sign-in
if yea he got a JWT but no account on backend the redirect to auth/sign-up/?firebaseUserExists=true&backendUserExists=false

the buttons need to take user to /app/wallet or what the fuck not
and catch-all take care of logging in and what the fuck not ye

## /auth/sign-in and /auth/sign-up

Must have already have an account sign in 
or dont have an account sign up

buttons on each page
