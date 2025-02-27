# @rpch/common

## 0.4.0

### Minor Changes

- 23f842a: Add quota_paid, quota_used columns

## 0.3.0

### Minor Changes

- 191b247: Updates to support nodejs v18 and native fetch

### Patch Changes

- fc83313: Refactored SDK for performance improvements specifically on incoming messages.

  - removes needless array conversion on segment building
  - correctly drops incoming segments that are not tied to a request
  - remove needless async handling in compression module

## 0.2.3

### Patch Changes

- Introduce parallel entry nodes & improve reliability score

## 0.2.2

### Patch Changes

- Improved entry node re-selection

## 0.2.1

### Patch Changes

- Fix breaking bug

## 0.2.0

### Minor Changes

- Introduce compression and many stability improvements

## 0.1.7

### Patch Changes

- Use @rpch/crypto v0.3.4

## 0.1.6

### Patch Changes

- Preparation release for Alpha
- Updated dependencies
  - @rpch/crypto-bridge@0.1.6

## 0.1.5

### Patch Changes

- Fix publishing bug
- Updated dependencies
  - @rpch/crypto-bridge@0.1.5

## 0.1.4

### Patch Changes

- Release of Sandbox v2
- Updated dependencies
  - @rpch/crypto-bridge@0.1.4

## 0.1.3

### Patch Changes

- Updated dependencies
  - @rpch/crypto-bridge@0.1.3

## 0.1.2

### Patch Changes

- Introduce web compatibility and various improvements.
- Updated dependencies
  - @rpch/crypto-bridge@0.1.2

## 0.1.1

### Patch Changes

- 43ba0b5: Minor patch to test publishing
- Updated dependencies [43ba0b5]
  - @rpch/crypto-bridge@0.1.1

## 0.1.0

### Minor Changes

- 9d40520: Initial release of RPCh packages

### Patch Changes

- Updated dependencies [9d40520]
  - @rpch/crypto-bridge@0.1.0
