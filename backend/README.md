# Melvin Backend

## Testing

Test utilities, helper functions and Test-Data are placed under [test/utils](test/utils)

### Unit-Tests

- Services
  - As a reference how to setup unit tests look into: [auth.service.spec.ts](src/resources/auth/auth.service.spec.ts)
  - Every method and code branch (if, else, switch, ...) should be tested
- Controllers:
  - As a reference how to setup unit tests look into: [auth.controller.spec.ts](src/resources/auth/auth.controller.spec.ts)
  - Every controller method should be tested to call the corresponding mocked service method

### E2E-Tests

- As a reference how to setup e2e tests look into: [auth.e2e-spec.ts](test/auth.e2e-spec.ts)
- Each endpoint should include these tests:
  - One valid request
  - One invalid request due to invalid data (e.g. body, params or query)
  - One invalid request due to invalid authentication (if endpoint is protected)
