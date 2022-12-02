# Epitelete

<p align="center"><img src="https://socialify.git.ci/Proskomma/epitelete/image?description=1&amp;font=Inter&amp;issues=1&amp;language=1&amp;owner=1&amp;pattern=Plus&amp;pulls=1&amp;theme=Light" alt="project-image"></p>

## Installation

  

Epitelete is available as an npm package.

```

npm install epitelete

```

## Usage

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#proskomma-mode">Proskomma mode</a>
      <ul>
        <li><a href="#pk-example">Example</a></li>
        <li><a href="#pk-howto">How to</a></li>
      </ul>
    </li>
    <li>
      <a href="#standalone-mode">Standalone mode</a>
      <ul>
        <li><a href="#ht-example">Example</a></li>
        <li><a href="#ht-howto">How to</a></li>
      </ul>
    </li>
  </ol>
</details>

### Proskomma mode

Uses a [proskomma](https://github.com/mvahowe/proskomma-js) instance to handle [PERF documents](https://github.com/Proskomma/proskomma-json-validator/blob/main/test/test_data/fra_lsg_jon_document.json).

<i id="pk-example"></i>
#### Example

```js
import Epitelete from "epitelete"
import Proskomma from "proskomma";

const proskomma = new Proskomma();
proskomma.loadSuccinctDocSet(succintJson);

const docSetId = "doc_set_id";
const epitelete = new Epitelete({ proskomma, docSetId });

const bookCode = "GEN";
let docPerf = epitelete.readPerf(bookCode);

const sequenceId = docPerf.mainSequence;
const sequence = docPerf.sequences[sequenceId];

//...make changes in sequence

docPerf = epitelete.writePerf(bookCode,sequenceId,sequence);
docPerf = epitelete.undoPerf(bookCode);
docPerf = epitelete.redoPerf(bookCode);
```

[![Edit Button](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/olsc55)

<i id="pk-howto"></i>
#### How to

**1. Install proskomma:**

```
npm install proskomma
```

**2. Instantiate and set Proskomma:**

```js

import Proskomma from "proskomma";

const proskomma = new Proskomma();

proskomma.loadSuccinctDocSet(succintJson);

...
```

`succintJson` : ...

**3. Instantiate Epitelete:**

```js

import Epitelete from "epitelete"

...

const docSetId = "doc_set_id";

const epitelete = new Epitelete({ proskomma, docSetId });

...
```

**4. Get a document:**

```js
...

const bookCode = "GEN";

let docPerf = epitelete.readPerf(bookCode);

...
```

`.readPerf()`: gets a document from cache or by fetching from the proskomma instance.

`docPerf`: copy of the document that has been saved in cache. [example docPerf content](https://github.com/Proskomma/proskomma-json-validator/blob/main/test/test_data/fra_lsg_jon_document.json)

**5. Make changes to some `docPerf` sequence:**

```js
...

const sequenceId = docPerf.mainSequence;

const sequence = docPerf.sequences[sequenceId];

//...make changes in sequence

...
```

**6. Persist changes to epitelete s history:**

```js
...

docPerf = epitelete.writePerf(bookCode,sequenceId,sequence);

...
```

`.writePerf()`: creates a copy of last saved document, updates it with the changed sequence and saves it in memory.

**7. Undo/Redo your changes to docPerf:**

```js
...

docPerf = epitelete.undoPerf(bookCode);

docPerf = epitelete.redoPerf(bookCode);

...
```

`.undoPerf()`: retrieves the previous changed document from history.

`.redoPerf()`: retrieves the next changed document from history.

History size can be set at instantiation with the `options` argument:

```js
const options = { historySize: 5 }

const epitelete = new Epitelete({ proskomma, docSetId, options });
```

### Standalone mode

Uses only given [PERF documents](https://github.com/Proskomma/proskomma-json-validator/blob/main/test/test_data/fra_lsg_jon_document.json).

<i id="ht-example"></i>
#### Example

```js
import Epitelete from "epitelete"

const docSetId = "doc_set_id";
const options = { historySize: 5 };
const epitelete = new Epitelete({ docSetId, options });

const bookCode = "GEN";
const perfJSON = {...}
let docPerf = await epitelete.sideloadPerf(bookCode,perfJSON);

const sequenceId = docPerf.mainSequence;
const sequence = docPerf.sequences[sequenceId];

//...make changes in sequence

docPerf = epitelete.writePerf(bookCode,sequenceId,sequence);
docPerf = epitelete.undoPerf(bookCode);
docPerf = epitelete.redoPerf(bookCode);
```
[![Edit Button](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/olsc55)

<i id="ht-howto"></i>
#### How to

**1. Instatiate Epilete:**

```js
import Epitelete from "epitelete"

...

const docSetId = "doc_set_id";

const epitelete = new Epitelete({ docSetId [,options] });

...
```

Optionally could set `historySize` in the `options` arg.

**2. Load a document into memory:**

```js
...

docPerf = await epitelete.sideloadPerf(bookCode, perfJSON);

...
```

`perfJSON`: externally loaded and parsed documentPerf.

  

**3. Use `writePerf`,`readPerf`,`undoPerf`,`redoPerf` as shown before.**

## API

[Complete Epitelete API](/docs/API.md)
## License

This project is licensed under the MIT.
