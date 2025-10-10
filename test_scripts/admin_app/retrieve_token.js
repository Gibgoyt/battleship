#!/bin/bash/env node

// gets the token once logged into /admin page

const token = decodeURIComponent(document.cookie.split(';').find(c => c.trim().startsWith('cognito-admin-auth-token='))?.split('=')[1] || '');
console.log(token);
navigator.clipboard.writeText(token);
