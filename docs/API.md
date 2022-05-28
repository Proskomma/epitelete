## Classes

<dl>
<dt><a href="#Epitelete">Epitelete</a></dt>
<dd><p>PERF Middleware for Editors in the Proskomma Ecosystem</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#documentPerf">documentPerf</a> : <code>Object.&lt;string, Object&gt;</code></dt>
<dd></dd>
<dt><a href="#sequencePerf">sequencePerf</a> : <code>Object.&lt;string, Object&gt;</code></dt>
<dd></dd>
</dl>

<a name="Epitelete"></a>

## Epitelete
PERF Middleware for Editors in the Proskomma Ecosystem

**Kind**: global class  

* [Epitelete](#Epitelete)
    * [new Epitelete(args)](#new_Epitelete_new)
    * [.getDocument(bookCode)](#Epitelete+getDocument) ⇒ [<code>documentPerf</code>](#documentPerf)
    * [.getDocuments()](#Epitelete+getDocuments) ⇒
    * [.addDocument(bookCode, doc)](#Epitelete+addDocument)
    * [.fetchPerf(bookCode)](#Epitelete+fetchPerf)
    * [.readPerf(bookCode)](#Epitelete+readPerf)
    * [.writePerf(bookCode, sequenceId, perfSequence)](#Epitelete+writePerf) ⇒ [<code>sequencePerf</code>](#sequencePerf)
    * [.checkPerfSequence(perfSequence)](#Epitelete+checkPerfSequence)
    * [.localBookCodes()](#Epitelete+localBookCodes)
    * [.bookHeaders()](#Epitelete+bookHeaders) ⇒ <code>Object</code>
    * [.clearPerf()](#Epitelete+clearPerf)
    * [.canUndo(bookCode)](#Epitelete+canUndo)
    * [.canRedo(bookCode)](#Epitelete+canRedo)
    * [.undoPerf(bookCode)](#Epitelete+undoPerf) ⇒ [<code>documentPerf</code>](#documentPerf)
    * [.redoPerf(bookCode)](#Epitelete+redoPerf) ⇒ [<code>documentPerf</code>](#documentPerf)
    * [.sideloadPerf(bookCode, perfJSON)](#Epitelete+sideloadPerf) ⇒ [<code>documentPerf</code>](#documentPerf)

<a name="new_Epitelete_new"></a>

### new Epitelete(args)
**Returns**: [<code>Epitelete</code>](#Epitelete) - Epitelete instance.  

| Param | Type | Description |
| --- | --- | --- |
| args | <code>Object</code> | constructor args |
| [args.proskomma] | <code>UWProskomma</code> | a proskomma instance. |
| args.docSetId | <code>integer</code> | a docSetId. |
| [args.options] | <code>Object</code> | setting params. |
| [args.options.historySize] | <code>integer</code> | size of history buffer. |

<a name="Epitelete+getDocument"></a>

### epitelete.getDocument(bookCode) ⇒ [<code>documentPerf</code>](#documentPerf)
Gets a copy of a document from history

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  

| Param | Type |
| --- | --- |
| bookCode | <code>string</code> | 

<a name="Epitelete+getDocuments"></a>

### epitelete.getDocuments() ⇒
Gets object containing documents copies from history

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  
<a name="Epitelete+addDocument"></a>

### epitelete.addDocument(bookCode, doc)
Adds new document to history (replaces any doc with same bookCode already in history)

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  

| Param | Type |
| --- | --- |
| bookCode | <code>string</code> | 
| doc | [<code>documentPerf</code>](#documentPerf) | 

<a name="Epitelete+fetchPerf"></a>

### epitelete.fetchPerf(bookCode)
Fetches document from proskomma instance

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  

| Param | Type |
| --- | --- |
| bookCode | <code>string</code> | 

<a name="Epitelete+readPerf"></a>

### epitelete.readPerf(bookCode)
Gets document from memory or fetches it if proskomma is set.

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  

| Param | Type |
| --- | --- |
| bookCode | <code>string</code> | 

<a name="Epitelete+writePerf"></a>

### epitelete.writePerf(bookCode, sequenceId, perfSequence) ⇒ [<code>sequencePerf</code>](#sequencePerf)
Merges a sequence with the document and saves the new modified document.

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  

| Param | Type |
| --- | --- |
| bookCode | <code>string</code> | 
| sequenceId | <code>integer</code> | 
| perfSequence | [<code>sequencePerf</code>](#sequencePerf) | 

<a name="Epitelete+checkPerfSequence"></a>

### epitelete.checkPerfSequence(perfSequence)
?Checks Perf Sequence

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  

| Param | Type |
| --- | --- |
| perfSequence | [<code>sequencePerf</code>](#sequencePerf) | 

<a name="Epitelete+localBookCodes"></a>

### epitelete.localBookCodes()
Get array of book codes from history

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  
<a name="Epitelete+bookHeaders"></a>

### epitelete.bookHeaders() ⇒ <code>Object</code>
Gets the available books for current docSet. Returns an object with book codes as keys, and values  contain book header data

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  
<a name="Epitelete+clearPerf"></a>

### epitelete.clearPerf()
Clears docs history

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  
<a name="Epitelete+canUndo"></a>

### epitelete.canUndo(bookCode)
Checks if able to undo from specific book history

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  

| Param | Type |
| --- | --- |
| bookCode | <code>string</code> | 

<a name="Epitelete+canRedo"></a>

### epitelete.canRedo(bookCode)
Checks if able to redo from specific book history

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  

| Param | Type |
| --- | --- |
| bookCode | <code>string</code> | 

<a name="Epitelete+undoPerf"></a>

### epitelete.undoPerf(bookCode) ⇒ [<code>documentPerf</code>](#documentPerf)
Gets previous document from history

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  

| Param | Type |
| --- | --- |
| bookCode | <code>string</code> | 

<a name="Epitelete+redoPerf"></a>

### epitelete.redoPerf(bookCode) ⇒ [<code>documentPerf</code>](#documentPerf)
Gets next document from history

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  

| Param | Type |
| --- | --- |
| bookCode | <code>string</code> | 

<a name="Epitelete+sideloadPerf"></a>

### epitelete.sideloadPerf(bookCode, perfJSON) ⇒ [<code>documentPerf</code>](#documentPerf)
Loads given perf into memory

**Kind**: instance method of [<code>Epitelete</code>](#Epitelete)  

| Param | Type |
| --- | --- |
| bookCode | <code>string</code> | 
| perfJSON | [<code>documentPerf</code>](#documentPerf) | 

<a name="documentPerf"></a>

## documentPerf : <code>Object.&lt;string, Object&gt;</code>
**Kind**: global typedef  
<a name="sequencePerf"></a>

## sequencePerf : <code>Object.&lt;string, Object&gt;</code>
**Kind**: global typedef  
