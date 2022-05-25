# Epitelete
PERF Middleware for Editors in the Proskomma Ecosystem

## Installation
```
npm install epitelete
```
## Usage
```
import Epitelete from 'epitelete';

// Instantiate Proskomma and load some content into it

const epi = new Epitelete(proskommaInstance, "doc_set_id");

epi.localBookCodes()   // => Array of 3-character book codes cached in Epitelete
epi.bookHeaders()      // => Object containing titles and other headers for each bookCode in Proskomma
epi.readPerf(bookCode) // => PERF for this bookCode, fetching from Proskomma if necessary
epi.clearPerf()        // Deletes all local PERF data
```
