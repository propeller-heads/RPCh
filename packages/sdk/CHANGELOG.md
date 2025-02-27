# @rpch/sdk

## 0.5.2

### Patch Changes

- 7633232: correctly handling msgpack unpack errors

## 0.5.1

### Patch Changes

- b9e964b: Minor bug fixes in the SDK
  Update load tests with smaller values and different distributions

## 0.5.0

### Minor Changes

- ed54216: Rework node selection algorithm:

  - query initial fixed amount of entry nodes (e.g. 10)
  - open websockets to all, determine best connection
  - close other connections
  - use determined routes as long as feasible
  - repeat

  Resending requests on fallback route if possible:

  - if request on preferred entry-exit combination does not work,
    we try resending it on the second best one

### Patch Changes

- Updated dependencies [23f842a]
  - @rpch/common@0.4.0

## 0.4.0

### Minor Changes

- 6f9a67b: Changed the SDK approach to only have one websocket open to one entry node
- ae6ca99: Refactored send API to take and return structured data.
  Change counter store to a per session store.

## 0.3.0

### Minor Changes

- 191b247: Updates to support nodejs v18 and native fetch
- fc83313: Refactored SDK for performance improvements specifically on incoming messages.

  - removes needless array conversion on segment building
  - correctly drops incoming segments that are not tied to a request
  - remove needless async handling in compression module

### Patch Changes

- Updated dependencies [191b247]
- Updated dependencies [fc83313]
  - @rpch/common@0.3.0

## 0.2.3

### Patch Changes

- Introduce parallel entry nodes & improve reliability score
- Updated dependencies
  - @rpch/common@0.2.3

## 0.2.2

### Patch Changes

- Improved entry node re-selection
- Updated dependencies
  - @rpch/common@0.2.2

## 0.2.1

### Patch Changes

- Updated dependencies
  - @rpch/common@0.2.1

## 0.2.0

### Minor Changes

- Introduce compression and many stability improvements

### Patch Changes

- Updated dependencies
  - @rpch/common@0.2.0

## 0.1.7

### Patch Changes

- Use @rpch/crypto v0.3.4
- Updated dependencies
  - @rpch/common@0.1.7

## 0.1.6

### Patch Changes

- Preparation release for Alpha
- Updated dependencies
  - @rpch/crypto-bridge@0.1.6
  - @rpch/common@0.1.6

## 0.1.5

### Patch Changes

- Fix publishing bug
- Updated dependencies
  - @rpch/crypto-bridge@0.1.5
  - @rpch/common@0.1.5

## 0.1.4

### Patch Changes

- Release of Sandbox v2
- Updated dependencies
  - @rpch/crypto-bridge@0.1.4
  - @rpch/common@0.1.4

## 0.1.3

### Patch Changes

- Updated dependencies
  - @rpch/crypto-bridge@0.1.3
  - @rpch/common@0.1.3

## 0.1.2

### Patch Changes

- Introduce web compatibility and various improvements.
- Updated dependencies
  - @rpch/crypto-bridge@0.1.2
  - @rpch/common@0.1.2

## 0.1.1

### Patch Changes

- 43ba0b5: Minor patch to test publishing
- Updated dependencies [43ba0b5]
  - @rpch/common@0.1.1
  - @rpch/crypto-bridge@0.1.1

## 0.1.0

### Minor Changes

- 9d40520: Initial release of RPCh packages

### Patch Changes

- Updated dependencies [9d40520]
  - @rpch/common@0.1.0
  - @rpch/crypto-bridge@0.1.0
