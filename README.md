# Epitelete

<p align="center"><img src="https://socialify.git.ci/Proskomma/epitelete/image?description=1&amp;font=Inter&amp;issues=1&amp;language=1&amp;owner=1&amp;pattern=Plus&amp;pulls=1&amp;theme=Light" alt="project-image"></p>


## Installation

Epitelete is available as an npm package.
```
npm install epitelete
```

## Usage

### Proskomma mode

Uses a [proskomma](https://github.com/mvahowe/proskomma-js) instance to handle [PERF documents](https://github.com/Proskomma/proskomma-json-validator/blob/main/test/test_data/fra_lsg_jon_document.json).
#### Steps
* Install proskomma:

  ```
  npm install uw-proskomma
  ```

* Instantiate and set proskomma:
  ```js
  import UWProskomma from "uw-proskomma";

  const proskomma = new UWProskomma();

  proskomma.loadSuccinctDocSet(someSuccintJson);

  ...
  ```

* Instantiate epitelete:

  ```js
  import Epitelete from "epitelete"
  ...

  const docSetId = "doc_set_id";

  const epitelete = new Epitelete({ proskomma, docSetId });

  ...
  ```

* Get a document:

  ```js
  ...

  const bookCode = "GEN";

  const docPerf = epitelete.readPerf(bookCode);

  ...
  ```
  `docPerf` is a copy of that document that has been saved in cache.

* 

## API

[api](/docs/API.md)

## License

This project is licensed under the MIT

