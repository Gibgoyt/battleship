# UserService

Handles user creation with validation, persistence, and event notification.

## Methods

### createUser(data)

Creates a new user with transactional integrity.

**Process Flow:**

1. Validates input data against schema
2. Opens database transaction
3. Inserts user and audit records
4. Emits creation event for downstream services