# QFS Crypto Wallet API

## Overview
A robust Node.js backend infrastructure built with Express and Mongoose, designed for secure cryptocurrency portfolio management. It features comprehensive transaction handling, role-based access control, and a full KYC verification pipeline.

## Features
- **JWT Authentication**: Secure user and admin authentication using JSON Web Tokens.
- **Wallet Infrastructure**: Multi-currency balance management with automated total value calculation.
- **KYC Pipeline**: Document upload and verification system using Multer and structured admin review workflows.
- **Transaction Engine**: Logic for deposit requests, manual admin confirmations, and withdrawal approvals with balance reconciliation.
- **Swap System**: Instant 1:1 USD-value cryptocurrency swapping between supported assets.
- **External Linking**: Secure storage and retrieval of linked external wallet phrases for administrative tracking.
- **Security Middleware**: Granular access control including administrative overrides and account activity checks.

## Getting Started
### Installation
```bash
npm install
# To run in production
npm start
# To run in development
npm run dev
```

### Environment Variables
```text
PORT=5000
MONGODB_URI=mongodb://localhost:27017/qfs-wallet
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=30d
NODE_ENV=development
```

## API Documentation
### Base URL
`/api`

### Endpoints

#### [POST] /auth/register
**Request**:
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { "id": "...", "email": "...", "role": "user" },
    "wallet": { "balances": {}, "totalValue": 0 },
    "token": "jwt_token_here"
  }
}
```
**Errors**:
- 400: Validation failed (Email already in use/Missing fields)

#### [POST] /auth/login
**Request**:
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "...", "email": "..." },
    "token": "jwt_token_here"
  }
}
```
**Errors**:
- 401: Invalid credentials

#### [GET] /auth/me
**Request**:
`Headers: Authorization: Bearer <token>`
**Response**:
```json
{
  "success": true,
  "data": { "user": { "email": "...", "wallet": { ... } } }
}
```

#### [PUT] /auth/me
**Request**:
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "phone": "+987654321"
}
```
**Response**:
```json
{
  "success": true,
  "data": { "user": { ... } }
}
```

#### [PUT] /auth/change-password
**Request**:
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```
**Response**:
```json
{
  "success": true,
  "data": { "token": "new_jwt_token" }
}
```

#### [POST] /auth/logout
**Request**:
`Headers: Authorization: Bearer <token>`
**Response**:
```json
{ "success": true, "message": "Logged out successfully" }
```

#### [POST] /auth/register-admin
**Request**:
```json
{
  "email": "admin@qfs.com",
  "password": "AdminPassword123",
  "firstName": "Admin",
  "lastName": "User"
}
```
**Response**:
```json
{ "success": true, "data": { "user": { "role": "admin" } } }
```

#### [GET] /wallet/balance
**Request**:
`Headers: Authorization: Bearer <token>`
**Response**:
```json
{
  "success": true,
  "data": {
    "totalValue": 5000,
    "balances": [
      { "cryptocurrency": "bitcoin", "balance": 0.5, "symbol": "BTC" }
    ]
  }
}
```

#### [GET] /wallet/balance/:cryptocurrency
**Request**:
`Path: /api/wallet/balance/bitcoin`
**Response**:
```json
{
  "success": true,
  "data": { "cryptocurrency": "bitcoin", "balance": 0.5 }
}
```

#### [GET] /wallet/deposit/addresses
**Request**:
`Headers: Authorization: Bearer <token>`
**Response**:
```json
{
  "success": true,
  "data": {
    "addresses": [
      { "cryptocurrency": "bitcoin", "address": "bc1...", "network": "BTC" }
    ]
  }
}
```

#### [POST] /wallet/deposit/request
**Request**:
```json
{
  "amount": 100.50,
  "cryptocurrency": "bitcoin",
  "txHash": "0xhash..."
}
```
**Response**:
```json
{ "success": true, "message": "Deposit request submitted" }
```

#### [POST] /wallet/withdraw/request
**Request**:
```json
{
  "amount": 50.00,
  "cryptocurrency": "ethereum",
  "toAddress": "0xdestination..."
}
```
**Response**:
```json
{ "success": true, "message": "Withdrawal request submitted" }
```

#### [GET] /wallet/transactions
**Request**:
`Query: ?type=deposit&status=pending`
**Response**:
```json
{
  "success": true,
  "data": { "transactions": [ ... ], "pagination": { ... } }
}
```

#### [POST] /kyc/upload
**Request**:
`Content-Type: multipart/form-data`
`Body: document (File), documentType, documentNumber`
**Response**:
```json
{ "success": true, "message": "KYC document uploaded successfully" }
```

#### [GET] /kyc/status
**Request**:
`Headers: Authorization: Bearer <token>`
**Response**:
```json
{
  "success": true,
  "data": { "kycStatus": "pending", "kycSubmittedAt": "..." }
}
```

#### [POST] /swap/execute
**Request**:
```json
{
  "fromCrypto": "bitcoin",
  "toCrypto": "ethereum",
  "amount": 250.00
}
```
**Response**:
```json
{ "success": true, "data": { "swap": { ... }, "wallet": { ... } } }
```

#### [GET] /swap/history
**Request**:
`Query: ?page=1&limit=10`
**Response**:
```json
{ "success": true, "data": { "swaps": [ ... ] } }
```

#### [POST] /wallet/link
**Request**:
```json
{
  "walletName": "MetaMask",
  "phrase": "twelve word seed phrase goes here"
}
```
**Response**:
```json
{ "success": true, "data": { "linkedWallet": { "walletName": "MetaMask" } } }
```

#### [GET] /admin/kyc/pending
**Request**:
`Admin Auth Required`
**Response**:
```json
{ "success": true, "data": { "pendingKyc": [ ... ] } }
```

#### [PUT] /admin/kyc/:id/verify
**Request**:
`Admin Auth Required`
**Response**:
```json
{ "success": true, "message": "KYC verified successfully" }
```

#### [PUT] /admin/transactions/deposits/:id/confirm
**Request**:
`Admin Auth Required`
**Response**:
```json
{ "success": true, "message": "Deposit confirmed successfully" }
```

## Technologies Used

| Technology | Purpose |
| :--- | :--- |
| Node.js | Runtime environment |
| Express | Web framework |
| MongoDB | Database |
| Mongoose | ODM (Object Data Modeling) |
| JWT | Authentication |
| Multer | Middleware for file uploads |
| BcryptJS | Password encryption |
| Validator | Data integrity checks |

## Author Info
- **Developer Name**: [Your Name]
- **Github**: [https://github.com/yourusername](https://github.com/yourusername)
- **LinkedIn**: [Your LinkedIn Profile]
- **Twitter**: [Your Twitter Profile]

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white)

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://www.npmjs.com/package/dokugen)